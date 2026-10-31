import { describe, expect, it } from '@jest/globals';

import { parseAnalysis } from './parseAnalysis';

describe('parseAnalysis', () => {
  it('reads the requested labelled lines', () => {
    expect(parseAnalysis('Object: clay pot\nDescription: A small brown pot painted with flowers.')).toEqual({
      object: 'Clay pot',
      description: 'A small brown pot painted with flowers.',
    });
  });

  it('tolerates markdown and leftover placeholder brackets', () => {
    expect(parseAnalysis('**Object:** <Silver rosary>\n**Description:** "Beads on a chain."')).toEqual({
      object: 'Silver rosary',
      description: 'Beads on a chain.',
    });
  });

  it('reads well-formed JSON', () => {
    expect(parseAnalysis('{"object": "old photograph", "description": "A sepia portrait of a couple."}')).toEqual({
      object: 'Old photograph',
      description: 'A sepia portrait of a couple.',
    });
  });

  it('recovers fields when the token limit cuts the JSON off', () => {
    expect(parseAnalysis('{"object": "Rosary", "description": "Wooden beads on a silver ch')).toEqual({
      object: 'Rosary',
      description: 'Wooden beads on a silver ch',
    });
  });

  it('keeps the name short and the description to one sentence', () => {
    const result = parseAnalysis(
      '{"object": "a very old wooden guitar case.", "description": "A guitar. It sits by the window. It is brown."}',
    );
    expect(result).toEqual({ object: 'A very old wooden', description: 'A guitar.' });
  });

  it('caps a run-on description', () => {
    const { description } = parseAnalysis(`{"object": "Candle", "description": "${'wax '.repeat(80)}"}`);
    expect(description.length).toBeLessThanOrEqual(180);
    expect(description.endsWith('…')).toBe(true);
  });

  it('leaves the description empty when the model only names the object', () => {
    expect(parseAnalysis('{"object": "Sugar skull"}')).toEqual({ object: 'Sugar skull', description: '' });
    expect(parseAnalysis(' Candle.')).toEqual({ object: 'Candle', description: '' });
  });

  it('reads a name followed by a sentence (how small models answer)', () => {
    expect(parseAnalysis(' Candle. It has an orange flame and is white.')).toEqual({
      object: 'Candle',
      description: 'It has an orange flame and is white.',
    });
  });

  it('names the object from the subject of a single sentence', () => {
    expect(parseAnalysis('The photo shows a sugar skull decorated with flowers.')).toEqual({
      object: 'Sugar skull',
      description: 'The photo shows a sugar skull decorated with flowers.',
    });
    expect(parseAnalysis('A white candle with an orange flame on a wooden table.')).toMatchObject({
      object: 'White candle',
    });
  });

  it('rejects output without an object', () => {
    expect(() => parseAnalysis('')).toThrow('could not make out the object');
    expect(() => parseAnalysis('{"description": "blurry"}')).toThrow('could not make out the object');
  });
});
