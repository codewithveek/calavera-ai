import { DownloadTask, File, type DownloadPauseState } from 'expo-file-system';

import { UserFacingError } from '@/shared/lib/errors';

import { allModelFileHandles, downloadDirectory, partialFileHandle, promotePartial } from './paths';
import { modelUrl, type ModelFile } from './registry';

export interface FileDownload {
  /** Resolves `true` when the bytes are on disk, `false` when paused. */
  done: Promise<boolean>;
  /** Pauses and returns state that can resume the transfer later. */
  pause: () => Promise<DownloadPauseState | null>;
  cancel: () => void;
}

interface StartOptions {
  onProgress: (bytesWritten: number) => void;
  resumeState?: DownloadPauseState;
}

/**
 * Resume point for a `.part` left behind when the app was killed mid-download
 * (no saved pause state). On Android, expo-file-system's resume data is the
 * byte offset it sends as a `Range` header; the native side truncates to it
 * and appends, or restarts cleanly if the server ignores the range.
 */
function resumeFromPartial(file: ModelFile, partial: File): DownloadPauseState | undefined {
  if (!partial.exists || partial.size === 0) return undefined;
  return { url: modelUrl(file), fileUri: partial.uri, isDirectory: false, resumeData: String(partial.size) };
}

const ALREADY_DOWNLOADED: FileDownload = {
  done: Promise.resolve(true),
  pause: async () => null,
  cancel: () => undefined,
};

/**
 * In-app download (used when the system downloader is unavailable): streams a
 * model into `<name>.part`; the final name only appears after verification.
 */
export function startFileDownload(file: ModelFile, { onProgress, resumeState }: StartOptions): FileDownload {
  downloadDirectory(); // creates the folder on first use
  const options = { onProgress: ({ bytesWritten }: { bytesWritten: number }) => onProgress(bytesWritten) };

  const partial = partialFileHandle(file);
  if (partial.exists && partial.size >= file.sizeBytes) {
    // Fully transferred but never verified (killed during the checksum), or oversized and corrupt.
    if (partial.size === file.sizeBytes) return ALREADY_DOWNLOADED;
    partial.delete();
  }

  // A saved pause state is only valid while its `.part` is still on disk.
  const resume = partial.exists ? (resumeState ?? resumeFromPartial(file, partial)) : undefined;
  let task: DownloadTask;
  let started: Promise<File | null>;
  if (resume) {
    task = DownloadTask.fromSavable(resume, options);
    started = task.resumeAsync();
  } else {
    task = File.createDownloadTask(modelUrl(file), partial, options);
    started = task.downloadAsync();
  }

  return {
    done: started.then((result) => result !== null),
    pause: async () => {
      if (task.state !== 'active') return null;
      await task.pauseAsync();
      return task.savable();
    },
    cancel: () => task.cancel(),
  };
}

/**
 * Confirms the exact size and SHA-256 of a finished download, then atomically
 * promotes `<name>.part` to its final name. A corrupt file is deleted.
 */
export async function verifyAndInstall(file: ModelFile): Promise<void> {
  const partial = partialFileHandle(file);
  if (!partial.exists || partial.size !== file.sizeBytes) {
    if (partial.exists) partial.delete();
    throw new UserFacingError(`${file.label} did not finish downloading. Please try again on a steady connection.`);
  }

  const digest = await partial.digest('SHA-256');
  if (digest !== file.sha256) {
    partial.delete();
    throw new UserFacingError(`${file.label} was damaged while downloading, so it was removed. Please try again.`);
  }

  promotePartial(file);
}

/** Removes installed weights and partial downloads for the given files, wherever they are. */
export function deleteModelFiles(files: readonly ModelFile[]): void {
  for (const handle of files.flatMap(allModelFileHandles)) {
    if (handle.exists) handle.delete();
  }
}
