import { trackCompletion, withVisionModel } from '@/features/engine/contextManager';
import type { ModelPack } from '@/features/models/registry';
import { placeOnOfrenda, type Placement } from '@/features/ofrenda/placement';

import { parseAnalysis } from './parseAnalysis';

export interface HeirloomAnalysis extends Placement {
  objectName: string;
  description: string;
  imageUri: string;
  /** Wall-clock seconds the on-device vision pass took. */
  seconds: number;
}

/**
 * Asks for the shape small vision models answer in naturally ("Candle. It has
 * an orange flame.") and parses it forgivingly (see parseAnalysis). No JSON
 * schema grammar: on a low-end CPU, grammar-constrained sampling took ~4.7 s
 * per token and a scan over 10 minutes; plain sampling scans in under a minute.
 */
const PROMPT =
  'What is the main object in this photo? A family wants to place it on a Día de los Muertos ofrenda. ' +
  'Answer in English with its name (1 to 4 words), then one sentence describing how it looks.';

/** The Input Layer: a local vision-language model reads the heirloom photo. */
export async function analyzeHeirloom(pack: ModelPack, imageUri: string): Promise<HeirloomAnalysis> {
  const startedAt = Date.now();

  const raw = await withVisionModel(pack, (context) =>
    trackCompletion(context, async () => {
      // Each scan is independent: never let a previous image bleed into this one.
      await context.clearCache(false);
      const result = await context.completion({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageUri } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
        enable_thinking: false,
        n_predict: 64,
        temperature: 0.2,
        top_p: 0.9,
        // Small vision models fall into loops ("con un poder de vivir, con un poder de vivir…").
        penalty_repeat: 1.15,
        penalty_last_n: 64,
      });
      return result.content || result.text;
    }),
  );

  const { object, description } = parseAnalysis(raw);
  return {
    objectName: object,
    description,
    imageUri,
    seconds: (Date.now() - startedAt) / 1000,
    ...placeOnOfrenda(object, description),
  };
}
