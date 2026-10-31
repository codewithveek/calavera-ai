import { Directory, File, Paths } from 'expo-file-system';

import { SystemDownloads } from '@modules/system-downloads';

import type { ModelFile } from './registry';

export const MODELS_FOLDER = 'models';

/** App-private storage (never evicted like the cache): in-app downloads and older installs. */
const privateDirectory = () => new Directory(Paths.document, MODELS_FOLDER);

let systemDirectoryCache: Directory | null | undefined;

/**
 * The app's own folder on shared storage, the only place Android's
 * DownloadManager can write to. Null when unavailable (then downloads run in-app).
 */
function systemDirectory(): Directory | null {
  if (systemDirectoryCache === undefined) {
    const path = SystemDownloads?.directory(MODELS_FOLDER);
    systemDirectoryCache = path ? new Directory(`file://${path}`) : null;
  }
  return systemDirectoryCache;
}

/** True when downloads can continue while the app is minimised or closed. */
export function usesSystemDownloads(): boolean {
  return systemDirectory() !== null;
}

/** Where new downloads are written. */
export function downloadDirectory(): Directory {
  const system = systemDirectory();
  if (system) return system;
  const directory = privateDirectory();
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
}

const locations = (): Directory[] => [systemDirectory(), privateDirectory()].filter((dir) => dir !== null);

/** The installed copy, wherever a complete file already is; otherwise where it will be installed. */
export function modelFileHandle(file: ModelFile): File {
  for (const directory of locations()) {
    const candidate = new File(directory, file.fileName);
    if (candidate.exists && candidate.size === file.sizeBytes) return candidate;
  }
  return new File(downloadDirectory(), file.fileName);
}

export function partialFileName(file: ModelFile): string {
  return `${file.fileName}.part`;
}

export function partialFileHandle(file: ModelFile): File {
  return new File(downloadDirectory(), partialFileName(file));
}

/** Every copy of a model, finished or partial, in every location (for deletion). */
export function allModelFileHandles(file: ModelFile): File[] {
  return locations().flatMap((directory) => [
    new File(directory, file.fileName),
    new File(directory, partialFileName(file)),
  ]);
}

/** Promotes a verified `.part` to its final name, atomically. */
export function promotePartial(file: ModelFile): void {
  if (systemDirectory() && SystemDownloads) {
    // expo-file-system cannot create new files on shared storage, so the rename is native.
    if (!SystemDownloads.rename(MODELS_FOLDER, partialFileName(file), file.fileName)) {
      throw new Error(`Could not rename ${partialFileName(file)}`);
    }
    return;
  }
  const target = new File(privateDirectory(), file.fileName);
  if (target.exists) target.delete();
  partialFileHandle(file).move(target);
}

/** llama.rn accepts `file://` URIs directly. */
export function modelPath(file: ModelFile): string {
  return modelFileHandle(file).uri;
}
