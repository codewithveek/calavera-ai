import { Paths } from 'expo-file-system';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { createThrottle } from '@/shared/lib/batcher';
import { toErrorMessage, UserFacingError } from '@/shared/lib/errors';
import { formatBytes } from '@/shared/lib/format';
import { createRateMeter } from '@/shared/lib/rate';

import { downloadActions } from './downloadStore';
import { startFileDownload, verifyAndInstall, type FileDownload } from './downloader';
import { activatePack, refreshModelQueries } from './packLifecycle';
import { usesSystemDownloads } from './paths';
import type { ModelFile, ModelPackId } from './registry';
import { useModelSettings } from './settingsStore';
import { readPackStatus } from './status';
import { cancelSystemDownloads, downloadWithSystem } from './systemDownloader';

/**
 * Module-level download orchestrator. It lives outside React so a 3 GB
 * transfer survives navigation and re-renders; components only observe
 * `useDownloadStore`. On Android the system downloader carries on while the
 * app is minimised or closed; the in-app path is the fallback.
 */

const KEEP_AWAKE_TAG = 'calavera-model-download';
const DISK_HEADROOM_BYTES = 300 * 1024 * 1024;
const PROGRESS_INTERVAL_MS = 250;

let running = false;
let stopRequested = false;
let active: { download: FileDownload; file: ModelFile } | null = null;

async function downloadOneInApp(file: ModelFile): Promise<boolean> {
  const settings = useModelSettings.getState();
  const resumeState = settings.pausedDownloads[file.id];
  const rate = createRateMeter();
  const progress = createThrottle(
    (bytes: number) => downloadActions.setProgress(file.id, bytes, rate(bytes)),
    PROGRESS_INTERVAL_MS,
  );

  downloadActions.setActiveFiles([file.id]);
  const download = startFileDownload(file, { onProgress: progress.push, resumeState });
  active = { download, file };

  try {
    return await download.done;
  } catch (error) {
    // A stale resume token can never succeed: forget it so a retry starts clean.
    if (resumeState) settings.clearPausedDownload(file.id);
    throw error;
  } finally {
    progress.flushNow();
    active = null;
  }
}

/** One file at a time inside the app; the screen is kept awake because the app must stay open. */
async function downloadInApp(files: readonly ModelFile[]): Promise<boolean> {
  await activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
  try {
    for (const file of files) {
      const completed = await downloadOneInApp(file);
      if (!completed || stopRequested) return false;

      useModelSettings.getState().clearPausedDownload(file.id);
      downloadActions.setPhase('verifying');
      await verifyAndInstall(file);
      await refreshModelQueries();
      downloadActions.setPhase('downloading');
    }
    return true;
  } finally {
    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
  }
}

/** Downloads every missing file of a pack. Resolves `true` once the whole pack is installed. */
export async function downloadPack(packId: ModelPackId): Promise<boolean> {
  if (running) return false;
  running = true;
  stopRequested = false;

  try {
    const status = readPackStatus(packId);
    if (status.ready) {
      downloadActions.setPhase('done');
      return true;
    }
    if (status.missingBytes + DISK_HEADROOM_BYTES > Paths.availableDiskSpace) {
      throw new UserFacingError(
        `Not enough storage. Free up ${formatBytes(status.missingBytes + DISK_HEADROOM_BYTES - Paths.availableDiskSpace)} and try again.`,
      );
    }

    downloadActions.setPhase('downloading');
    const missing = status.files.filter(({ installed }) => !installed).map(({ file }) => file);
    const inBackground = usesSystemDownloads();
    const finished = inBackground
      ? await downloadWithSystem(packId, missing, () => stopRequested)
      : await downloadInApp(missing);

    if (!finished) {
      // A system download stopped means cancelled; an in-app one can resume later.
      downloadActions.setPhase(inBackground ? 'idle' : 'paused');
      return false;
    }
    downloadActions.setPhase('done');
    return true;
  } catch (error) {
    downloadActions.setPhase('error', toErrorMessage(error, 'Download failed. Please try again on Wi-Fi.'));
    return false;
  } finally {
    running = false;
    downloadActions.setActiveFiles([]);
    await refreshModelQueries();
  }
}

/** Downloads the pack, then switches the app to it. */
export async function downloadAndActivate(packId: ModelPackId): Promise<void> {
  if (await downloadPack(packId)) await activatePack(packId);
}

/** Picks up downloads Android kept running while the app was closed. */
export function resumeBackgroundDownload(): void {
  const tracked = useModelSettings.getState().systemDownloads;
  if (tracked && !running) void downloadAndActivate(tracked.packId);
}

/** True when stopping cancels (system downloads cannot pause) rather than pauses. */
export const stopCancelsDownload = usesSystemDownloads;

/** Pauses an in-app download, or cancels a system one. */
export async function stopDownload(): Promise<void> {
  stopRequested = true;
  if (usesSystemDownloads()) {
    cancelSystemDownloads();
    downloadActions.reset();
    return;
  }
  const current = active;
  if (!current) return;
  const state = await current.download.pause();
  if (state) useModelSettings.getState().savePausedDownload(current.file.id, state);
}
