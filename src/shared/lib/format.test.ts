import { describe, expect, it } from '@jest/globals';

import { slugify } from './format';

describe('slugify', () => {
  it('strips accents and joins words with hyphens', () => {
    expect(slugify('Abuela Rosa Núñez')).toBe('abuela-rosa-nunez');
  });

  it('collapses punctuation and trims separators', () => {
    expect(slugify('  ¡Tío "Chuy" (1938)!  ')).toBe('tio-chuy-1938');
  });

  it('returns an empty string when nothing is left', () => {
    expect(slugify('💀')).toBe('');
  });
});
