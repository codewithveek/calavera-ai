/** The language a poem itself is written in. */
export type VerseLanguage = 'es' | 'en';

/** What the person asks for: Spanish, English, or the Spanish original with an English translation. */
export type PoemLanguage = VerseLanguage | 'both';

export const POEM_LANGUAGES: readonly { id: PoemLanguage; label: string; caption: string }[] = [
  { id: 'both', label: 'Spanish + English', caption: 'The Spanish original with an English translation. Takes a little longer.' },
  { id: 'es', label: 'Spanish', caption: 'The traditional way: the whole poem in Spanish.' },
  { id: 'en', label: 'English', caption: 'The whole poem written in English.' },
];

export const DEFAULT_POEM_LANGUAGE: PoemLanguage = 'both';

export const writtenIn = (language: PoemLanguage): VerseLanguage => (language === 'en' ? 'en' : 'es');

/** Offline text-to-speech voice for each language. */
export const SPEECH_LOCALE: Record<VerseLanguage, string> = { es: 'es-MX', en: 'en-US' };
