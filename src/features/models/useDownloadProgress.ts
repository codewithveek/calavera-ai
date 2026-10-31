import { useDownloadStore } from './downloadStore';
import { usesSystemDownloads } from './paths';
import type { FileStatus } from './status';

/** Merges on-disk status with live byte counts from the running download. */
export function useDownloadProgress(files: FileStatus[], totalBytes: number) {
  const bytesByFile = useDownloadStore((state) => state.bytesByFile);
  const activeFileIds = useDownloadStore((state) => state.activeFileIds);

  // Android's DownloadManager allocates the whole file up front, so a `.part` size is not progress there.
  const partialIsProgress = !usesSystemDownloads();

  const rows = files.map(({ file, installed, partialBytes }) => {
    const onDisk = partialIsProgress ? partialBytes : 0;
    const bytes = installed ? file.sizeBytes : Math.max(bytesByFile[file.id] ?? 0, onDisk);
    return { file, installed, bytes, active: !installed && activeFileIds.includes(file.id) };
  });
  const doneBytes = rows.reduce((total, row) => total + row.bytes, 0);

  return { rows, doneBytes, remainingBytes: totalBytes - doneBytes, fraction: doneBytes / totalBytes };
}
