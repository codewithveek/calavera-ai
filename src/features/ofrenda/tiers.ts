export type OfrendaTier = 'cielo' | 'tierra' | 'inframundo';

export interface TierInfo {
  name: string;
  english: string;
  meaning: string;
}

/** The traditional three-level ofrenda: heaven, earth and the underworld. */
export const TIERS: Record<OfrendaTier, TierInfo> = {
  cielo: {
    name: 'Cielo',
    english: 'Heaven',
    meaning: 'The highest tier holds the sacred and the portrait of the departed, so the soul knows this altar is theirs.',
  },
  tierra: {
    name: 'Tierra',
    english: 'Earth',
    meaning: 'The middle tier carries the pleasures of life (favourite food, drink and belongings) to welcome the soul home.',
  },
  inframundo: {
    name: 'Inframundo',
    english: 'Underworld',
    meaning: 'The lowest tier lights the way back from Mictlán with candles, copal, marigolds, water and salt.',
  },
};

export const TIER_ORDER: readonly OfrendaTier[] = ['cielo', 'tierra', 'inframundo'];
