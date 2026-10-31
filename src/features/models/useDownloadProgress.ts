import { useDownloadStore } from './downloadStore';
import type { FileStatus } from './status';

/** Merges on-disk status with live byte counts from the running download. */
export function useDownloadProgress(files: FileStatus[], totalBytes: number) {
  const bytesByFile = useDownloadStore((state) => state.bytesByFile);
  const currentFileId = useDownloadStore((state) => state.currentFileId);

  const rows = files.map(({ file, installed, partialBytes }) => {
    const bytes = installed ? file.sizeBytes : Math.max(bytesByFile[file.id] ?? 0, partialBytes);
    return { file, installed, bytes, active: file.id === currentFileId };
  });
  const doneBytes = rows.reduce((total, row) => total + row.bytes, 0);

  return { rows, doneBytes, remainingBytes: totalBytes - doneBytes, fraction: doneBytes / totalBytes };
}
