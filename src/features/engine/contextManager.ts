import { initLlama, type LlamaContext } from 'llama.rn';

import { createMutex } from '@/shared/lib/mutex';
import { UserFacingError } from '@/shared/lib/errors';
import { createThrottle } from '@/shared/lib/batcher';
import { canHoldTwoHeavyModels } from '@/features/models/device';
import { modelPath } from '@/features/models/paths';
import { MODEL_FILES, type ModelFile, type ModelPack } from '@/features/models/registry';

import { EMBEDDING_CONTEXT, GENERATIVE_CONTEXT, IMAGE_MAX_TOKENS } from './config';
import { engineActions } from './engineStore';

/**
 * Owns every llama.rn context in the app.
 *
 * - All inference runs through one FIFO queue: low-end phones never run two
 *   models at once, and a context is never released while it is in use.
 * - "Heavy" generative contexts are LRU-evicted so phones under 7.5 GB keep
 *   only one resident; the tiny embedder stays loaded.
 */

interface HeavySlot {
  path: string;
  label: string;
  context: LlamaContext;
  projectorPath: string | null;
}

const runExclusive = createMutex();

let heavySlots: HeavySlot[] = [];
let embedder: { path: string; context: LlamaContext } | null = null;
let runningCompletion: LlamaContext | null = null;

const maxHeavySlots = () => (canHoldTwoHeavyModels() ? 2 : 1);
const residentLabels = () => heavySlots.map((slot) => slot.label);

async function initWithProgress(file: ModelFile, label: string, params: typeof GENERATIVE_CONTEXT) {
  const progress = createThrottle((value: number) => engineActions.loading(label, value / 100), 150);
  engineActions.loading(label, 0);
  try {
    return await initLlama({ model: modelPath(file), ...params }, progress.push);
  } catch (error) {
    engineActions.failed();
    throw new UserFacingError(`Could not load ${label}. Free some memory and try again.`, { cause: error });
  }
}

async function acquireHeavy(file: ModelFile, label: string): Promise<HeavySlot> {
  const path = modelPath(file);
  const existing = heavySlots.find((slot) => slot.path === path);
  if (existing) {
    heavySlots = [...heavySlots.filter((slot) => slot !== existing), existing];
    return existing;
  }

  while (heavySlots.length >= maxHeavySlots()) {
    const [oldest, ...rest] = heavySlots;
    heavySlots = rest;
    await oldest?.context.release();
  }

  const context = await initWithProgress(file, label, GENERATIVE_CONTEXT);
  const slot: HeavySlot = { path, label, context, projectorPath: null };
  heavySlots = [...heavySlots, slot];
  engineActions.loaded(residentLabels());
  return slot;
}

/** Runs `task` with the pack's writer model loaded. */
export function withTextModel<T>(pack: ModelPack, task: (context: LlamaContext) => Promise<T>): Promise<T> {
  return runExclusive(async () => {
    const slot = await acquireHeavy(MODEL_FILES[pack.text], pack.textModelLabel);
    // The vision projector is ~0.5 GB; drop it when writing on smaller phones.
    if (slot.projectorPath && maxHeavySlots() === 1) {
      await slot.context.releaseMultimodal();
      slot.projectorPath = null;
    }
    return task(slot.context);
  });
}

/** Runs `task` with the pack's vision model and its projector loaded. */
export function withVisionModel<T>(pack: ModelPack, task: (context: LlamaContext) => Promise<T>): Promise<T> {
  return runExclusive(async () => {
    const slot = await acquireHeavy(MODEL_FILES[pack.vision.model], pack.visionModelLabel);
    const projectorPath = modelPath(MODEL_FILES[pack.vision.projector]);
    if (slot.projectorPath !== projectorPath) {
      engineActions.loading(`${pack.visionModelLabel} vision`, 0.5);
      const enabled = await slot.context.initMultimodal({
        path: projectorPath,
        use_gpu: false,
        image_max_tokens: IMAGE_MAX_TOKENS,
      });
      engineActions.loaded(residentLabels());
      if (!enabled) throw new UserFacingError('The vision model could not start on this device.');
      slot.projectorPath = projectorPath;
    }
    return task(slot.context);
  });
}

/** Runs `task` with the sentence-embedding model loaded (kept resident: ~25 MB). */
export function withEmbedder<T>(pack: ModelPack, task: (context: LlamaContext) => Promise<T>): Promise<T> {
  return runExclusive(async () => {
    const file = MODEL_FILES[pack.embedding];
    const path = modelPath(file);
    if (embedder?.path !== path) {
      await embedder?.context.release();
      embedder = null;
      const context = await initWithProgress(file, 'MiniLM embeddings', EMBEDDING_CONTEXT);
      embedder = { path, context };
      engineActions.loaded(residentLabels());
    }
    return task(embedder.context);
  });
}

/** Tracks the in-flight completion so the UI can stop it from anywhere. */
export async function trackCompletion<T>(context: LlamaContext, run: () => Promise<T>): Promise<T> {
  runningCompletion = context;
  try {
    return await run();
  } finally {
    runningCompletion = null;
  }
}

export async function stopActiveCompletion(): Promise<void> {
  await runningCompletion?.stopCompletion();
}

/** Frees the large generative models (queued behind any running inference). */
export function releaseHeavyModels(): Promise<void> {
  return runExclusive(async () => {
    const slots = heavySlots;
    heavySlots = [];
    await Promise.all(slots.map((slot) => slot.context.release()));
    engineActions.loaded([]);
  });
}

/** Frees everything, e.g. before model files are deleted or replaced. */
export function releaseAllModels(): Promise<void> {
  return runExclusive(async () => {
    const contexts = [...heavySlots.map((slot) => slot.context), ...(embedder ? [embedder.context] : [])];
    heavySlots = [];
    embedder = null;
    await Promise.all(contexts.map((context) => context.release()));
    engineActions.loaded([]);
  });
}
