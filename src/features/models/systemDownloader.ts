import { SystemDownloads, type SystemDownloadInfo, type SystemDownloadReason } from '@modules/system-downloads';

import { UserFacingError } from '@/shared/lib/errors';
import { createRateMeter } from '@/shared/lib/rate';

import { downloadActions, type DownloadWait } from './downloadStore';
import { verifyAndInstall } from './downloader';
import { refreshModelQueries } from './packLifecycle';
import { MODELS_FOLDER, partialFileName } from './paths';
import { modelUrl, type ModelFile, type ModelFileId, type ModelPackId } from './registry';
import { useModelSettings } from './settingsStore';

/**
 * The background path: every missing file is handed to Android's
 * DownloadManager at once, so the whole pack keeps downloading while the app is
 * minimised or closed. While the app is open, progress is polled and each
 * finished file is checked (size + SHA-256) and installed.
 */

const POLL_INTERVAL_MS = 1000;

const WAITS: Partial<Record<SystemDownloadReason, DownloadWait>> = {
  'waiting-for-network': 'network',
  'waiting-for-wifi': 'wifi',
  retrying: 'retry',
};

type TrackedIds = Partial<Record<ModelFileId, number>>;

const idList = (ids: TrackedIds): number[] => Object.values(ids).filter((id) => id !== undefined);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function system() {
  if (!SystemDownloads) throw new Error('The system downloader is not available');
  return SystemDownloads;
}

/** Updates the saved ids, unless the download was cancelled meanwhile (a relaunch must not restart it). */
function track(packId: ModelPackId, ids: TrackedIds) {
  const settings = useModelSettings.getState();
  if (settings.systemDownloads?.packId === packId) settings.trackSystemDownloads({ packId, ids: { ...ids } });
}

/** Keeps downloads Android is still running (e.g. from before a relaunch) and queues the rest. */
function reattachOrEnqueue(packId: ModelPackId, files: readonly ModelFile[]): TrackedIds {
  const tracked = useModelSettings.getState().systemDownloads;
  const previous: TrackedIds = tracked?.packId === packId ? tracked.ids : {};
  if (tracked && tracked.packId !== packId) system().remove(idList(tracked.ids));

  const live = new Map(system().query(idList(previous)).map((info) => [info.id, info]));
  const ids: TrackedIds = {};
  for (const file of files) {
    const id = previous[file.id];
    const info = id === undefined ? undefined : live.get(id);
    if (id !== undefined && info && info.status !== 'failed') {
      ids[file.id] = id;
      continue;
    }
    if (id !== undefined) system().remove([id]);
    ids[file.id] = system().enqueue(
      modelUrl(file),
      MODELS_FOLDER,
      partialFileName(file),
      `Calavera AI · ${file.label}`,
      'Downloading for offline use',
    );
  }
  useModelSettings.getState().trackSystemDownloads({ packId, ids: { ...ids } });
  return ids;
}

function downloadFailed(file: ModelFile, info: SystemDownloadInfo | undefined): UserFacingError {
  if (info?.reason === 'no-space') return new UserFacingError('Your phone ran out of space. Free some up and try again.');
  return new UserFacingError(`${file.label} could not finish downloading. Please try again on a steady connection.`);
}

/** Checks and installs a finished file, then forgets its system download. */
async function install(packId: ModelPackId, ids: TrackedIds, file: ModelFile) {
  const id = ids[file.id];
  downloadActions.setPhase('verifying');
  try {
    await verifyAndInstall(file);
  } finally {
    // Either installed (renamed away) or deleted as damaged: the system entry is done with.
    if (id !== undefined) system().remove([id]);
    delete ids[file.id];
    track(packId, ids);
  }
  await refreshModelQueries();
  downloadActions.setPhase('downloading');
}

/** Resolves `true` once every file is installed, `false` if `shouldStop()` turns true first. */
export async function downloadWithSystem(
  packId: ModelPackId,
  files: readonly ModelFile[],
  shouldStop: () => boolean,
): Promise<boolean> {
  const ids = reattachOrEnqueue(packId, files);
  const remaining = new Map(files.map((file) => [file.id, file]));
  const rate = createRateMeter();
  // Installed files leave `remaining`; keep their bytes so the measured rate never dips.
  let installedBytes = 0;

  while (remaining.size > 0) {
    if (shouldStop()) return false;

    const infos = new Map(system().query(idList(ids)).map((info) => [info.id, info]));
    const bytesByFile: TrackedIds = {};
    const activeFileIds: ModelFileId[] = [];
    const finished: ModelFile[] = [];
    let waitingFor: DownloadWait | null = null;
    let totalBytes = installedBytes;

    for (const file of remaining.values()) {
      const id = ids[file.id];
      const info = id === undefined ? undefined : infos.get(id);
      if (!info || info.status === 'failed') {
        if (id !== undefined) system().remove([id]);
        delete ids[file.id];
        track(packId, ids);
        throw downloadFailed(file, info);
      }
      bytesByFile[file.id] = info.bytesDownloaded;
      totalBytes += info.bytesDownloaded;
      if (info.status === 'successful') {
        finished.push(file);
      } else {
        activeFileIds.push(file.id);
        waitingFor ??= info.reason ? (WAITS[info.reason] ?? null) : null;
      }
    }

    downloadActions.setSnapshot({ activeFileIds, bytesByFile, bytesPerSecond: rate(totalBytes), waitingFor });

    for (const file of finished) {
      await install(packId, ids, file);
      remaining.delete(file.id);
      installedBytes += file.sizeBytes;
    }
    if (remaining.size > 0) await sleep(POLL_INTERVAL_MS);
  }

  useModelSettings.getState().trackSystemDownloads(null);
  return true;
}

/** Android's DownloadManager cannot pause: cancelling removes the downloads and their partial files. */
export function cancelSystemDownloads(): void {
  const tracked = useModelSettings.getState().systemDownloads;
  if (tracked) system().remove(idList(tracked.ids));
  useModelSettings.getState().trackSystemDownloads(null);
}
