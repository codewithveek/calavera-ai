import { trackCompletion, withTextModel } from '@/features/engine/contextManager';
import { findRelatedMemories } from '@/features/memories/service';
import type { ModelPack } from '@/features/models/registry';
import { listOfrendaNames } from '@/features/ofrenda/repo';
import { getProfile } from '@/features/profiles/repo';
import { insertTribute } from '@/features/tributes/repo';
import { UserFacingError } from '@/shared/lib/errors';

import { writtenIn, type PoemLanguage } from './languages';
import { cleanTranslation, parseVerseOutput, toStanzas } from './parser';
import { buildCalaveritaPrompt, buildTranslationPrompt } from './prompt';
import { figureName, toneAt, type DeathFigureId } from './tones';

export interface GenerateInput {
  profileId: number;
  toneLevel: number;
  figureId: DeathFigureId;
  focus: string;
  language: PoemLanguage;
}

export type GeneratePhase = 'retrieving' | 'writing' | 'translating' | 'saving';

export interface GenerateCallbacks {
  onPhase: (phase: GeneratePhase) => void;
  onMemoriesUsed: (count: number) => void;
  onToken: (token: string) => void;
  onTranslationToken: (token: string) => void;
}

/** Retrieval budget: enough context to be personal, small enough to prefill fast on a CPU. */
const MAX_MEMORIES = 4;
const MAX_MEMORY_CHARS = 1100;
const MAX_POEM_TOKENS = 360;
const MAX_TRANSLATION_TOKENS = 320;
const MIN_POEM_LINES = 4;

function takeWithinBudget(texts: readonly string[], budget: number): string[] {
  const picked: string[] = [];
  let used = 0;
  for (const text of texts) {
    if (used + text.length > budget) break;
    picked.push(text);
    used += text.length;
  }
  return picked;
}

/**
 * The Output Layer: retrieve the ancestor's closest memories from sqlite-vec,
 * compose a culturally anchored prompt, stream a calaverita from the
 * on-device LLM and save it as a tribute.
 */
export async function generateCalaverita(
  pack: ModelPack,
  input: GenerateInput,
  callbacks: GenerateCallbacks,
): Promise<number> {
  callbacks.onPhase('retrieving');
  const profile = await getProfile(input.profileId);
  if (!profile) throw new UserFacingError('This loved one is no longer in the archive.');

  const query = [profile.name, profile.essence, input.focus, 'habits, trade, favourite things and funny stories']
    .filter(Boolean)
    .join('. ');
  const [matches, ofrendaItems] = await Promise.all([
    findRelatedMemories(pack, query, { profileId: profile.id, limit: MAX_MEMORIES }),
    listOfrendaNames(profile.id),
  ]);
  const memories = takeWithinBudget(
    matches.map((match) => match.content),
    MAX_MEMORY_CHARS,
  );
  callbacks.onMemoriesUsed(memories.length);

  const tone = toneAt(input.toneLevel);
  const figure = figureName(input.figureId);
  const language = writtenIn(input.language);
  const prompt = buildCalaveritaPrompt({ profile, memories, ofrendaItems, focus: input.focus }, tone, figure, language);

  callbacks.onPhase('writing');
  const result = await withTextModel(pack, (context) =>
    trackCompletion(context, () =>
      context.completion(
        {
          messages: [{ role: 'user', content: prompt }],
          enable_thinking: false,
          n_predict: MAX_POEM_TOKENS,
          temperature: tone.temperature,
          top_k: 40,
          top_p: 0.92,
          min_p: 0.05,
          penalty_repeat: 1.08,
          penalty_last_n: 128,
        },
        (data) => callbacks.onToken(data.token),
      ),
    ),
  );

  const { poem } = parseVerseOutput(result.content || result.text);
  const lineCount = toStanzas(poem).flat().length;
  if (lineCount < MIN_POEM_LINES) {
    throw new UserFacingError(
      result.interrupted ? 'Stopped before the first stanza was finished.' : 'The spirits were silent. Please try again.',
    );
  }

  // Stopped mid-poem means stop: keep what was written and skip the translation.
  const translation =
    input.language === 'both' && !result.interrupted ? await translatePoem(pack, poem, callbacks) : null;

  callbacks.onPhase('saving');
  return insertTribute({
    profileId: profile.id,
    tone: tone.level,
    figure,
    poem,
    language,
    translation,
    modelLabel: pack.textModelLabel,
    tokensPerSecond: result.timings?.predicted_per_second ?? null,
  });
}

/**
 * Second pass for "Spanish + English". The poem is already complete, so a
 * failed or stopped translation saves the Spanish poem on its own.
 */
async function translatePoem(pack: ModelPack, poem: string, callbacks: GenerateCallbacks): Promise<string | null> {
  callbacks.onPhase('translating');
  try {
    const result = await withTextModel(pack, (context) =>
      trackCompletion(context, () =>
        context.completion(
          {
            messages: [{ role: 'user', content: buildTranslationPrompt(poem) }],
            enable_thinking: false,
            n_predict: MAX_TRANSLATION_TOKENS,
            temperature: 0.3,
            top_p: 0.9,
          },
          (data) => callbacks.onTranslationToken(data.token),
        ),
      ),
    );
    if (result.interrupted) return null;
    return cleanTranslation(result.content || result.text) || null;
  } catch {
    return null;
  }
}
