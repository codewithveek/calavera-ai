import { describe, expect, it } from '@jest/globals';

import { chunkText } from './chunker';

describe('chunkText', () => {
  it('returns nothing for blank input', () => {
    expect(chunkText('  \n ')).toEqual([]);
  });

  it('keeps a short story as a single chunk', () => {
    expect(chunkText('He fixed radios. He sang every morning!')).toEqual(['He fixed radios. He sang every morning!']);
  });

  it('respects the size budget and overlaps one sentence between chunks', () => {
    const story = 'One two three four. Five six seven eight. Nine ten eleven twelve. Thirteen fourteen.';
    const chunks = chunkText(story, { maxChars: 70 });

    expect(chunks).toEqual([
      'One two three four. Five six seven eight. Nine ten eleven twelve.',
      'Nine ten eleven twelve. Thirteen fourteen.',
    ]);
  });

  it('drops the overlap when it would not fit beside the next sentence', () => {
    const story = 'One two three four. Five six seven eight. Nine ten eleven twelve. Thirteen fourteen.';
    const chunks = chunkText(story, { maxChars: 45 });

    chunks.forEach((chunk) => expect(chunk.length).toBeLessThanOrEqual(45));
    expect(chunks.join(' ')).toContain('Thirteen fourteen.');
  });

  it('splits a single over-long sentence on word boundaries', () => {
    const chunks = chunkText('word '.repeat(40).trim(), { maxChars: 50 });
    chunks.forEach((chunk) => expect(chunk.length).toBeLessThanOrEqual(50));
    expect(chunks.join(' ').split(' ')).toHaveLength(40);
  });
});
