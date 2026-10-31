import type { ContextParams } from 'llama.rn';

type RuntimeParams = Omit<ContextParams, 'model'>;

/**
 * CPU-only, memory-mapped inference tuned for mid/low-end ARM phones:
 * - 4 threads targets the performance cluster of big.LITTLE SoCs,
 * - mmap lets the OS page weights in and out instead of committing RAM,
 * - a single sequence and a 2K window keep the KV cache small.
 */
const SHARED: RuntimeParams = {
  n_threads: 4,
  n_gpu_layers: 0,
  n_parallel: 1,
  use_mmap: true,
  use_mlock: false,
};

/** Used for both writing and seeing, so one Gemma 4 context can serve both. */
export const GENERATIVE_CONTEXT: RuntimeParams = {
  ...SHARED,
  n_ctx: 2048,
  n_batch: 256,
  ctx_shift: false,
};

export const EMBEDDING_CONTEXT: RuntimeParams = {
  ...SHARED,
  n_ctx: 512,
  n_batch: 512,
  n_ubatch: 512,
  embedding: true,
  pooling_type: 'mean',
};

/** Caps vision tokens per image: faster prefill and less memory on small devices. */
export const IMAGE_MAX_TOKENS = 256;

/** How long the app may sit in the background before large models are released. */
export const BACKGROUND_RELEASE_DELAY_MS = 30_000;
