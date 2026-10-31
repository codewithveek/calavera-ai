import { describe, expect, it } from '@jest/globals';

import { cleanTranslation, parseVerseOutput, toStanzas } from './parser';

describe('parseVerseOutput', () => {
  it('treats a partially streamed scratchpad tag as planning', () => {
    expect(parseVerseOutput('<rim')).toEqual({ planning: true, notes: '', poem: '' });
  });

  it('exposes rhyme notes while the scratchpad is open', () => {
    expect(parseVerseOutput('<rimas>cantar/altar')).toEqual({ planning: true, notes: 'cantar/altar', poem: '' });
  });

  it('hides the scratchpad and cleans markdown from the poem', () => {
    const parsed = parseVerseOutput('<rimas>a/b</rimas>\n**Llegó la Catrina un día**\n"no me voy"');
    expect(parsed).toEqual({ planning: false, notes: 'a/b', poem: 'Llegó la Catrina un día\nno me voy' });
  });

  it('keeps planning while the closing tag is still arriving', () => {
    expect(parseVerseOutput('<rimas>casa/brasa\n</ri')).toEqual({ planning: true, notes: 'casa/brasa', poem: '' });
  });

  it('recovers the poem when the model never closes the scratchpad', () => {
    expect(parseVerseOutput('<rimas> casa/brasa, tamal/final\nLa Catrina llegó a casa\ncon un tamal')).toEqual({
      planning: false,
      notes: 'casa/brasa, tamal/final',
      poem: 'La Catrina llegó a casa\ncon un tamal',
    });
  });

  it('accepts output when the model skips the scratchpad', () => {
    expect(parseVerseOutput('Llegó la Muerte\ncon prisa').poem).toBe('Llegó la Muerte\ncon prisa');
  });
});

describe('toStanzas', () => {
  it('splits on blank lines', () => {
    expect(toStanzas('a\nb\n\nc\nd')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('falls back to quatrains when stanza breaks are missing', () => {
    expect(toStanzas('a\nb\nc\nd\ne\nf\ng\nh')).toEqual([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g', 'h'],
    ]);
  });
});

describe('cleanTranslation', () => {
  it('drops a lead-in line and markdown', () => {
    expect(cleanTranslation("Here's the English translation:\n**Grandma Rosa, La Catrina came**\nwith a wink")).toBe(
      'Grandma Rosa, La Catrina came\nwith a wink',
    );
  });

  it('keeps a translation that starts straight away', () => {
    expect(cleanTranslation('Death came knocking at the door\n\nShe laughed')).toBe(
      'Death came knocking at the door\n\nShe laughed',
    );
  });
});
