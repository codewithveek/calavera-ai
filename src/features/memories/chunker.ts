/**
 * Splits a narrative into sentence-aligned chunks for embedding.
 * Chunks overlap by one sentence so a memory that spans a boundary is
 * still retrievable from either side.
 */

const SENTENCE_PATTERN = /[^.!?…\n]+(?:[.!?…]+|\n|$)/g;

export interface ChunkOptions {
  maxChars?: number;
  overlapSentences?: number;
}

function splitSentences(text: string): string[] {
  const normalized = text.replace(/[ \t]+/g, ' ').trim();
  return (normalized.match(SENTENCE_PATTERN) ?? []).map((s) => s.trim()).filter(Boolean);
}

/** Breaks a single over-long sentence on word boundaries. */
function splitLongSentence(sentence: string, maxChars: number): string[] {
  const parts: string[] = [];
  let current = '';
  for (const word of sentence.split(' ')) {
    if (current && current.length + word.length + 1 > maxChars) {
      parts.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) parts.push(current);
  return parts;
}

export function chunkText(text: string, { maxChars = 480, overlapSentences = 1 }: ChunkOptions = {}): string[] {
  const sentences = splitSentences(text).flatMap((s) => (s.length > maxChars ? splitLongSentence(s, maxChars) : [s]));
  if (sentences.length === 0) return [];

  const chunks: string[] = [];
  let window: string[] = [];
  let length = 0;

  for (const sentence of sentences) {
    if (window.length > 0 && length + sentence.length + 1 > maxChars) {
      chunks.push(window.join(' '));
      window = window.slice(-overlapSentences);
      length = window.reduce((total, s) => total + s.length + 1, 0);
      if (length + sentence.length + 1 > maxChars) {
        window = [];
        length = 0;
      }
    }
    window.push(sentence);
    length += sentence.length + 1;
  }
  chunks.push(window.join(' '));
  return chunks;
}
