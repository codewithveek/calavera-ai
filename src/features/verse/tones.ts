export interface Tone {
  level: number;
  label: string;
  english: string;
  directive: string;
  temperature: number;
}

/** The tone slider: from a tender homage to a classic biting calaverita. */
export const TONES: readonly Tone[] = [
  {
    level: 0,
    label: 'Tierno',
    english: 'Tender',
    directive: 'Gentle and loving. The humour is soft and affectionate, closer to a homage than a joke.',
    temperature: 0.7,
  },
  {
    level: 1,
    label: 'Cariñoso',
    english: 'Warm',
    directive: 'Warm family teasing about small habits, full of affection.',
    temperature: 0.75,
  },
  {
    level: 2,
    label: 'Juguetón',
    english: 'Playful',
    directive: 'Playful and witty, with a light punchline in every stanza.',
    temperature: 0.8,
  },
  {
    level: 3,
    label: 'Pícaro',
    english: 'Cheeky',
    directive: 'Cheeky and mischievous: poke fun at their quirks and their trade with clever wordplay.',
    temperature: 0.85,
  },
  {
    level: 4,
    label: 'Satírico',
    english: 'Satirical',
    directive: 'Sharp, classic satire that mocks their habits and profession with wit, never with cruelty.',
    temperature: 0.9,
  },
];

export const DEFAULT_TONE_LEVEL = 2;

export function toneAt(level: number): Tone {
  return TONES[Math.max(0, Math.min(TONES.length - 1, Math.round(level)))] ?? TONES[DEFAULT_TONE_LEVEL]!;
}

export type DeathFigureId = 'catrina' | 'parca' | 'muerte';

export const DEATH_FIGURES: readonly { id: DeathFigureId; name: string }[] = [
  { id: 'catrina', name: 'La Catrina' },
  { id: 'parca', name: 'La Parca' },
  { id: 'muerte', name: 'La Muerte' },
];

export function figureName(id: string): string {
  return DEATH_FIGURES.find((figure) => figure.id === id)?.name ?? 'La Catrina';
}
