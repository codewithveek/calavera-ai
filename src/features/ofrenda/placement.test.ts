import { describe, expect, it } from '@jest/globals';

import { placeOnOfrenda } from './placement';

describe('placeOnOfrenda', () => {
  it.each([
    ['Old photograph', 'A black and white portrait', 'cielo', 'El retrato'],
    ['Rosary', 'Wooden beads', 'cielo', 'Imágenes sagradas'],
    ['Pan de muerto', 'A round sweet bread', 'tierra', 'Pan de muerto'],
    ['Sugar skull', 'Colourful icing', 'tierra', 'Calavera de azúcar'],
    ['Tequila bottle', 'A glass bottle', 'tierra', 'Su bebida'],
    ['Candle', 'A tall white candle', 'inframundo', 'Las velas'],
    ['Marigold flowers', 'Orange petals', 'inframundo', 'Flor de cempasúchil'],
  ])('%s goes on the %s tier', (objectName, description, tier, spanishName) => {
    expect(placeOnOfrenda(objectName, description)).toMatchObject({ tier, spanishName });
  });

  it('trusts the object name over surroundings in the description', () => {
    expect(placeOnOfrenda('Guitar', 'A wooden guitar next to a candle')).toMatchObject({
      tier: 'tierra',
      spanishName: 'Un recuerdo personal',
    });
  });

  it('falls back to the description when the object name is generic', () => {
    expect(placeOnOfrenda('An object', 'A tall white candle burning')).toMatchObject({ tier: 'inframundo' });
  });

  it('does not match keywords inside other words', () => {
    expect(placeOnOfrenda('Sunglasses', 'Dark lenses')).toMatchObject({ spanishName: 'Un recuerdo personal' });
  });
});
