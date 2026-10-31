import { Paths } from 'expo-file-system';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { createThrottle } from '@/shared/lib/batcher';
import { toErrorMessage, UserFacingError } from '@/shared/lib/errors';
import { formatBytes } from '@/shared/lib/format';
import { createRateMeter } from '@/shared/lib/rate';
import { queryClient } from '@/shared/query/queryClient';

import { downloadActions } from './downloadStore';
import { startFileDownload, verifyAndInstall, type FileDownload } from './downloader';
import type { ModelFile, ModelPackId } from './registry';
import { useModelSettings } from './settingsStore';
import { readPackStatus } from './status';

/**
 * Module-level download orchestrator. It lives outside React so a 3 GB
 * transfer survives navigation and re-renders; components only observe
 * `useDownloadStore`.
 */

const KEEP_AWAKE_TAG = 'calavera-model-download';
const DISK_HEADROOM_BYTES = 300 * 1024 * 1024;
const PROGRESS_INTERVAL_MS = 250;

let running = false;
let stopRequested = false;
let active: { download: FileDownload; file: ModelFile } | null = null;

function refreshStatus() {
  return queryClient.invalidateQueries({ queryKey: ['models'] });
}

async function downloadOne(file: ModelFile): Promise<boolean> {
  const settings = useModelSettings.getState();
  const resumeState = settings.pausedDownloads[file.id];
  const rate = createRateMeter();
  const progress = createThrottle(
    (bytes: number) => downloadActions.setProgress(file.id, bytes, rate(bytes)),
    PROGRESS_INTERVAL_MS,
  );

  downloadActions.setCurrentFile(file.id);
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

    await activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    downloadActions.setPhase('downloading');

    for (const { file, installed } of status.files) {
      if (installed) continue;
      const completed = await downloadOne(file);
      if (!completed || stopRequested) {
        downloadActions.setPhase('paused');
        return false;
      }

      useModelSettings.getState().clearPausedDownload(file.id);
      downloadActions.setPhase('verifying');
      await verifyAndInstall(file);
      await refreshStatus();
      downloadActions.setPhase('downloading');
    }

    downloadActions.setPhase('done');
    return true;
  } catch (error) {
    downloadActions.setPhase('error', toErrorMessage(error, 'Download failed. Please retry on Wi-Fi.'));
    return false;
  } finally {
    running = false;
    downloadActions.setCurrentFile(null);
    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    await refreshStatus();
  }
}

export async function pauseDownload(): Promise<void> {
  const current = active;
  if (!current) return;
  stopRequested = true;
  const state = await current.download.pause();
  if (state) useModelSettings.getState().savePausedDownload(current.file.id, state);
}
