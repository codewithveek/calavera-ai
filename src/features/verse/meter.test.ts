import { describe, expect, it } from '@jest/globals';

import { countLineSyllables, countWordSyllables, meterVerdict } from './meter';

describe('countWordSyllables', () => {
  it.each([
    ['día', 2],
    ['baúl', 2],
    ['cielo', 2],
    ['poeta', 3],
    ['Muerte', 2],
    ['hoy', 1],
    ['que', 1],
    ['guitarra', 3],
    ['pingüino', 3],
    ['calavera', 4],
    ['ruido', 2],
  ])('%s has %i syllables', (word, expected) => {
    expect(countWordSyllables(word)).toBe(expected);
  });
});

describe('countLineSyllables', () => {
  it.each([
    ['La Muerte vino por él', 8], // aguda ending: +1
    ['con su guitarra cantaba', 8], // llana ending
    ['y la Parca muy contenta', 8],
    ['se lo llevó al panteón', 8], // sinalefa "llevó al"
    ['Estaba la Catrina', 7],
  ])('"%s" measures %i', (line, expected) => {
    expect(countLineSyllables(line)).toBe(expected);
  });

  it('ignores punctuation and empty input', () => {
    expect(countLineSyllables('¡La Muerte vino por él!')).toBe(8);
    expect(countLineSyllables('   ')).toBe(0);
  });
});

describe('meterVerdict', () => {
  it('accepts octosyllables and tolerates one syllable of licence', () => {
    expect(meterVerdict(8)).toBe('exact');
    expect(meterVerdict(9)).toBe('close');
    expect(meterVerdict(7)).toBe('close');
    expect(meterVerdict(11)).toBe('off');
  });
});
