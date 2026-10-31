import { describe, expect, it } from '@jest/globals';

import {
  countEnglishLineSyllables,
  countEnglishWordSyllables,
  countLineSyllables,
  countSyllables,
  countWordSyllables,
  meterVerdict,
} from './meter';

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

describe('countEnglishWordSyllables', () => {
  it.each([
    ['death', 1],
    ['came', 1],
    ['loved', 1],
    ['knocking', 2],
    ['little', 2],
    ['tortillas', 3],
    ['Catrina', 3],
  ])('%s has %i syllable(s)', (word, syllables) => {
    expect(countEnglishWordSyllables(word)).toBe(syllables);
  });

  it('ignores punctuation', () => {
    expect(countEnglishWordSyllables('“door,”')).toBe(1);
    expect(countEnglishWordSyllables('—')).toBe(0);
  });
});

describe('countSyllables', () => {
  it('counts English lines by vowel groups', () => {
    expect(countEnglishLineSyllables('Death came knocking at the door')).toBe(7);
    expect(countSyllables('Grandma Rosa loved to sing', 'en')).toBe(7);
  });

  it('uses the Spanish métrica for Spanish lines', () => {
    expect(countSyllables('Llegó la Catrina un día', 'es')).toBe(countLineSyllables('Llegó la Catrina un día'));
  });
});
