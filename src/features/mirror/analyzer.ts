import { trackCompletion, withVisionModel } from '@/features/engine/contextManager';
import type { ModelPack } from '@/features/models/registry';
import { placeOnOfrenda, type Placement } from '@/features/ofrenda/placement';
import { UserFacingError } from '@/shared/lib/errors';

export interface HeirloomAnalysis extends Placement {
  objectName: string;
  description: string;
  imageUri: string;
  /** Wall-clock seconds the on-device vision pass took. */
  seconds: number;
}

/**
 * Grammar-constrained output: llama.cpp converts this schema into a GBNF
 * grammar, so even a 500M vision model can only emit valid JSON.
 */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    object: { type: 'string', minLength: 2, maxLength: 40 },
    description: { type: 'string', minLength: 8, maxLength: 180 },
  },
  required: ['object', 'description'],
};

const PROMPT =
  'This photo shows something a family wants to place on a Día de los Muertos ofrenda (altar). ' +
  'Identify the single main object. Answer in English as JSON with "object" (1 to 4 words naming it) ' +
  'and "description" (one sentence describing how it looks).';

function tidy(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function parseResponse(raw: string): { object: string; description: string } {
  try {
    const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) as Record<string, unknown>;
    const object = typeof json.object === 'string' ? tidy(json.object) : '';
    const description = typeof json.description === 'string' ? tidy(json.description) : '';
    if (object) return { object, description: description || object };
  } catch {
    // fall through to the user-facing error below
  }
  throw new UserFacingError('The mirror could not make out the object. Try a closer, brighter photo.');
}

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
        response_format: { type: 'json_schema', json_schema: { strict: true, schema: RESPONSE_SCHEMA } },
        enable_thinking: false,
        n_predict: 128,
        temperature: 0.2,
        top_p: 0.9,
      });
      return result.content || result.text;
    }),
  );

  const { object, description } = parseResponse(raw);
  return {
    objectName: object,
    description,
    imageUri,
    seconds: (Date.now() - startedAt) / 1000,
    ...placeOnOfrenda(object, description),
  };
}
