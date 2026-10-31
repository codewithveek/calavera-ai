import { UserFacingError } from '@/shared/lib/errors';

const MAX_OBJECT_WORDS = 4;
const MAX_DESCRIPTION_CHARS = 180;

export interface AnalysisFields {
  object: string;
  description: string;
}

/** `Object: Clay pot` lines, tolerating markdown bold and leftover `<…>` placeholder brackets. */
function readLabelledLine(raw: string, labels: string): string {
  const match = new RegExp(`^[\\s*_#-]*(?:${labels})[\\s*_]*[:：]\\s*(.+)$`, 'im').exec(raw);
  return match?.[1]?.replace(/^[\s"'<*_]+|[\s"'>*_]+$/g, '') ?? '';
}

const LEAD_IN = /^(?:this is|it is|it's|there is|the (?:image|photo|picture) shows|i see)\s+/i;
const ARTICLE = /^(?:an?|the)\s+/i;
const PHRASE_END =
  /\s+(?:with|on|in|that|which|of|and|sitting|standing|lying|next|against|decorated|painted|made|filled|covered|placed)\b.*$|[,;:].*$/i;

/**
 * Plain prose, the way small vision models naturally answer: "Candle. It has an
 * orange flame." (name, then description) or one sentence whose subject names
 * the object ("A white candle with an orange flame on a table.").
 */
function readProse(raw: string): AnalysisFields {
  const sentences = raw.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const [first = '', ...rest] = sentences;
  if (rest.length > 0 && first.split(' ').length <= MAX_OBJECT_WORDS + 1) {
    return { object: first, description: rest.join(' ') };
  }
  return { object: first.replace(LEAD_IN, '').replace(ARTICLE, '').replace(PHRASE_END, ''), description: first };
}

/**
 * Whatever each field holds: labelled lines, JSON (even cut off mid-string by
 * the token limit), or plain prose.
 */
function readFields(raw: string): AnalysisFields {
  const object = readLabelledLine(raw, 'object|name|item');
  if (object) return { object, description: readLabelledLine(raw, 'description|appearance') };
  if (!raw.includes('{')) return readProse(raw);

  try {
    const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)) as Record<string, unknown>;
    return {
      object: typeof json.object === 'string' ? json.object : '',
      description: typeof json.description === 'string' ? json.description : '',
    };
  } catch {
    const field = (key: string) => new RegExp(`"${key}"\\s*:\\s*"([^"]*)`).exec(raw)?.[1] ?? '';
    return { object: field('object'), description: field('description') };
  }
}

function tidy(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function firstSentence(text: string): string {
  const sentence = /^.*?[.!?](?=\s|$)/.exec(text)?.[0] ?? text;
  return sentence.length > MAX_DESCRIPTION_CHARS ? `${sentence.slice(0, MAX_DESCRIPTION_CHARS - 1).trimEnd()}…` : sentence;
}

/**
 * Turns the vision model's answer into a short name and one-sentence
 * description. Format and lengths are enforced here, not with a sampling
 * grammar: grammar-constrained decoding slowed every token to a crawl on
 * low-end CPUs.
 */
export function parseAnalysis(raw: string): AnalysisFields {
  const fields = readFields(raw);
  const object = tidy(fields.object).split(' ').slice(0, MAX_OBJECT_WORDS).join(' ').replace(/[.,;:]+$/, '');
  if (!object) throw new UserFacingError('The mirror could not make out the object. Try a closer, brighter photo.');
  const description = firstSentence(tidy(fields.description));
  // "Candle." on its own names the object; it does not describe it.
  const comparable = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return { object, description: comparable(description) === comparable(object) ? '' : description };
}
