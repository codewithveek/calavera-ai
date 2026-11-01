import type { ModelPack } from '@/features/models/registry';

import { withEmbedder } from './contextManager';

/** MiniLM's window is 512 tokens; ~1,500 characters stays well inside it. */
const MAX_EMBED_CHARS = 1500;
/** llama.cpp's Euclidean (L2) normalisation, matching sqlite-vec cosine distance. */
const L2_NORMALIZE = 2;

export function embedTexts(pack: ModelPack, texts: readonly string[]): Promise<Float32Array[]> {
  return withEmbedder(pack, async (context) => {
    const vectors: Float32Array[] = [];
    for (const text of texts) {
      // llama.rn's embedding() empties the KV cache but keeps the previous prompt's tokens, so the
      // next prompt skips its shared prefix and is pooled from a fragment. clearCache() resets both.
      await context.clearCache(false);
      const { embedding } = await context.embedding(text.slice(0, MAX_EMBED_CHARS), {
        embd_normalize: L2_NORMALIZE,
      });
      vectors.push(Float32Array.from(embedding));
    }
    return vectors;
  });
}

export async function embedText(pack: ModelPack, text: string): Promise<Float32Array> {
  const [vector] = await embedTexts(pack, [text]);
  if (!vector) throw new Error('Embedding model returned no vector.');
  return vector;
}
