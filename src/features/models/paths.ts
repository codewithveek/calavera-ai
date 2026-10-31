import { Directory, File, Paths } from 'expo-file-system';

import type { ModelFile } from './registry';

/** Weights live in the documents directory: the OS never evicts it like the cache. */
const modelsDirectory = () => new Directory(Paths.document, 'models');

export function ensureModelsDirectory(): Directory {
  const directory = modelsDirectory();
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
}

export function modelFileHandle(file: ModelFile): File {
  return new File(modelsDirectory(), file.fileName);
}

export function partialFileHandle(file: ModelFile): File {
  return new File(modelsDirectory(), `${file.fileName}.part`);
}

/** llama.rn accepts `file://` URIs directly. */
export function modelPath(file: ModelFile): string {
  return modelFileHandle(file).uri;
}
