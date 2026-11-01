import { withTransaction } from '@/db/database';
import { embedText, embedTexts } from '@/features/engine/embeddings';
import type { ModelPack } from '@/features/models/registry';
import { UserFacingError } from '@/shared/lib/errors';

import { chunkText } from './chunker';
import { insertMemory, listStaleChunks, replaceStaleVectors, searchMemories } from './repo';
import type { MemoryMatch, MemorySource } from './types';

export interface PreparedMemory {
  profileId: number;
  source: MemorySource;
  body: string;
  chunks: string[];
  vectors: Float32Array[];
}

/** Chunks and embeds a narrative on-device. Pure inference: nothing is written yet. */
export async function prepareMemory(
  pack: ModelPack,
  input: { profileId: number; source: MemorySource; body: string },
): Promise<PreparedMemory> {
  const body = input.body.trim();
  const chunks = chunkText(body);
  if (chunks.length === 0) throw new UserFacingError('Write a few words before saving the memory.');
  const vectors = await embedTexts(pack, chunks);
  return { ...input, body, chunks, vectors };
}

/** The Storage Layer: text → chunks → 384-d vectors → sqlite-vec. */
export async function addMemory(
  pack: ModelPack,
  input: { profileId: number; source: MemorySource; body: string },
): Promise<number> {
  const prepared = await prepareMemory(pack, input);
  return withTransaction((db) => insertMemory(db, prepared));
}

/** Re-embeds chunks saved before the embedding fix, once; a no-op afterwards. */
async function refreshStaleVectors(pack: ModelPack): Promise<void> {
  const stale = await listStaleChunks();
  if (stale.length === 0) return;
  const vectors = await embedTexts(
    pack,
    stale.map((chunk) => chunk.content),
  );
  await replaceStaleVectors(stale, vectors);
}

export async function findRelatedMemories(
  pack: ModelPack,
  query: string,
  options: { profileId: number | null; limit: number },
): Promise<MemoryMatch[]> {
  await refreshStaleVectors(pack);
  const vector = await embedText(pack, query);
  return searchMemories(vector, options);
}
