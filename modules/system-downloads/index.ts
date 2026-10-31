import { requireOptionalNativeModule } from 'expo';

export type SystemDownloadStatus = 'pending' | 'running' | 'paused' | 'successful' | 'failed';

export type SystemDownloadReason =
  | 'waiting-for-network'
  | 'waiting-for-wifi'
  | 'retrying'
  | 'paused'
  | 'no-space'
  | 'no-storage'
  | 'failed';

export interface SystemDownloadInfo {
  id: number;
  status: SystemDownloadStatus;
  /** Why a download is paused or failed; null otherwise. */
  reason: SystemDownloadReason | null;
  bytesDownloaded: number;
  /** -1 until the server reports a size. */
  totalBytes: number;
}

interface SystemDownloadsModule {
  /** Absolute path of the app's own folder on shared storage, or null when unavailable. */
  directory(folderName: string): string | null;
  /** Queues a download with Android's DownloadManager; returns its id. */
  enqueue(url: string, folderName: string, fileName: string, title: string, description: string): number;
  /** Status of the given downloads (unknown ids are simply missing from the result). */
  query(ids: number[]): SystemDownloadInfo[];
  /** Cancels downloads and deletes their partial files. */
  remove(ids: number[]): number;
  /** Renames a file within the folder; returns false if the rename failed. */
  rename(folderName: string, from: string, to: string): boolean;
}

/**
 * Android's DownloadManager: downloads continue while the app is minimised or
 * closed. Null where the native module is unavailable (tests, other platforms).
 */
export const SystemDownloads = requireOptionalNativeModule<SystemDownloadsModule>('SystemDownloads');
