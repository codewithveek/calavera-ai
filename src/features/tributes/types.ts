import type { VerseLanguage } from '@/features/verse/languages';

export interface Tribute {
  id: number;
  profileId: number;
  profileName: string;
  profileRelation: string;
  profileLifeSpan: string;
  tone: number;
  figure: string;
  poem: string;
  /** The language `poem` is written in. */
  language: VerseLanguage;
  /** English translation of a Spanish poem, when both were asked for. */
  translation: string | null;
  modelLabel: string;
  tokensPerSecond: number | null;
  createdAt: number;
}

export type NewTribute = Pick<
  Tribute,
  'profileId' | 'tone' | 'figure' | 'poem' | 'language' | 'translation' | 'modelLabel' | 'tokensPerSecond'
>;
