import { modelFileHandle, partialFileHandle } from './paths';
import { MODEL_PACKS, packFiles, type ModelFile, type ModelPackId } from './registry';

export interface FileStatus {
  file: ModelFile;
  installed: boolean;
  /** Bytes already on disk from an interrupted download. */
  partialBytes: number;
}

export interface PackStatus {
  packId: ModelPackId;
  ready: boolean;
  files: FileStatus[];
  missingBytes: number;
}

/**
 * Fast integrity check used at every launch: an exact byte-size match.
 * The full SHA-256 is verified once, right after each download.
 */
export function readFileStatus(file: ModelFile): FileStatus {
  const handle = modelFileHandle(file);
  const installed = handle.exists && handle.size === file.sizeBytes;
  const partial = partialFileHandle(file);
  return { file, installed, partialBytes: !installed && partial.exists ? partial.size : 0 };
}

export function readPackStatus(packId: ModelPackId): PackStatus {
  const files = packFiles(MODEL_PACKS[packId]).map(readFileStatus);
  return {
    packId,
    ready: files.every((status) => status.installed),
    files,
    missingBytes: files.reduce(
      (total, status) => total + (status.installed ? 0 : status.file.sizeBytes - status.partialBytes),
      0,
    ),
  };
}
