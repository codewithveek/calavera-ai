import { SCRATCHPAD_TAG } from './prompt';

const OPEN = `<${SCRATCHPAD_TAG}>`;
const CLOSE = `</${SCRATCHPAD_TAG}>`;

export interface ParsedOutput {
  /** True while the model is still writing inside its hidden scratchpad. */
  planning: boolean;
  /** Rhyme pairs the model planned (shown only as a hint). */
  notes: string;
  /** The visible poem text so far. */
  poem: string;
}

/** Strips markdown and chatter that small models sometimes add around a poem. */
function cleanLine(line: string): string {
  return line
    .replace(/[*_#`>]+/g, '')
    .replace(/^\s*["“”«»]+|["“”«»]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPoem(text: string): string {
  return text
    .split('\n')
    .map(cleanLine)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Splits streamed model output into the hidden rhyme plan and the visible poem. */
export function parseVerseOutput(raw: string): ParsedOutput {
  const text = raw.trimStart();
  const closeAt = text.indexOf(CLOSE);

  if (closeAt >= 0) {
    const openAt = text.indexOf(OPEN);
    const notes = text.slice(openAt >= 0 ? openAt + OPEN.length : 0, closeAt).trim();
    return { planning: false, notes, poem: cleanPoem(text.slice(closeAt + CLOSE.length)) };
  }

  // The opening tag is still arriving token by token.
  if (text.length > 0 && OPEN.startsWith(text)) return { planning: true, notes: '', poem: '' };

  if (text.startsWith(OPEN)) {
    const body = text.slice(OPEN.length).trimStart();
    const newlineAt = body.indexOf('\n');
    const rest = newlineAt >= 0 ? body.slice(newlineAt + 1).trimStart() : '';
    // Still planning: the plan is one line, and the closing tag may be arriving.
    if (newlineAt < 0 || CLOSE.startsWith(rest)) {
      return { planning: true, notes: (newlineAt < 0 ? body : body.slice(0, newlineAt)).trim(), poem: '' };
    }
    // Small models sometimes move on without closing the tag: after the plan line, it's the poem.
    return { planning: false, notes: body.slice(0, newlineAt).trim(), poem: cleanPoem(rest) };
  }

  // The model skipped the scratchpad: everything is poem.
  return { planning: false, notes: '', poem: cleanPoem(text) };
}

/** Groups poem lines into stanzas; falls back to quatrains if blank lines are missing. */
export function toStanzas(poem: string): string[][] {
  const stanzas = poem
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0);

  if (stanzas.length === 1 && stanzas[0]!.length > 4) {
    const lines = stanzas[0]!;
    const quatrains: string[][] = [];
    for (let i = 0; i < lines.length; i += 4) quatrains.push(lines.slice(i, i + 4));
    return quatrains;
  }
  return stanzas;
}

/** A streamed translation without markdown, quotes or a "Here is the translation:" lead-in. */
export function cleanTranslation(raw: string): string {
  return cleanPoem(raw.replace(/^\s*(?:here(?:'s| is)[^\n]*|(?:english )?translation)\s*:?\s*\n/i, ''));
}
