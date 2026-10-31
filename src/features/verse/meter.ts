/**
 * Spanish poetic syllable counter (métrica), used to check octosílabos.
 *
 * Rules applied:
 * - Diphthongs: a weak vowel (i, u) next to any vowel shares a syllable,
 *   unless the weak vowel carries an accent (hiatus: "día", "baúl").
 * - Two strong vowels (a, e, o) form a hiatus.
 * - Silent "u" in que/qui/gue/gui; "y" is a vowel only at a word's end.
 * - Sinalefa: a word ending in a vowel merges with the next one starting
 *   with a vowel (or silent h + vowel).
 * - Line ending: aguda +1, llana +0, esdrújula −1.
 */

const STRONG = new Set(['a', 'e', 'o', 'á', 'é', 'ó', 'í', 'ú']);
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ü']);
const ACCENTED = new Set(['á', 'é', 'í', 'ó', 'ú']);

function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-záéíóúüñ]/g, '')
    .replace(/q(u)(?=[eiéí])/g, 'q')
    .replace(/g(u)(?=[eiéí])/g, 'g')
    .replace(/y$/, 'i');
}

/** Returns the vowel nuclei of a word, each as the index of its first vowel. */
function nuclei(word: string): number[] {
  const starts: number[] = [];
  let previousVowel: string | null = null;

  for (let i = 0; i < word.length; i++) {
    const char = word[i]!;
    if (!VOWELS.has(char)) {
      previousVowel = null;
      continue;
    }
    const hiatus = previousVowel !== null && STRONG.has(previousVowel) && STRONG.has(char);
    if (previousVowel === null || hiatus) starts.push(i);
    previousVowel = char;
  }
  return starts;
}

export function countWordSyllables(word: string): number {
  return nuclei(normalizeWord(word)).length;
}

type Stress = 'aguda' | 'llana' | 'esdrujula';

function stressOf(word: string): Stress {
  const normalized = normalizeWord(word);
  const starts = nuclei(normalized);
  if (starts.length <= 1) return 'aguda';

  const accentIndex = [...normalized].findIndex((char) => ACCENTED.has(char));
  if (accentIndex >= 0) {
    const syllable = starts.filter((start) => start <= accentIndex).length;
    const fromEnd = starts.length - syllable;
    if (fromEnd === 0) return 'aguda';
    if (fromEnd === 1) return 'llana';
    return 'esdrujula';
  }
  return /[aeiouns]$/.test(normalized) ? 'llana' : 'aguda';
}

const startsWithVowelSound = (word: string) => /^h?[aeiouáéíóú]/.test(normalizeWord(word));
const endsWithVowel = (word: string) => /[aeiouáéíóú]$/.test(normalizeWord(word));

export function countLineSyllables(line: string): number {
  const words = line.split(/\s+/).filter((word) => normalizeWord(word).length > 0);
  if (words.length === 0) return 0;

  let total = 0;
  words.forEach((word, index) => {
    total += countWordSyllables(word);
    const next = words[index + 1];
    if (next && endsWithVowel(word) && startsWithVowelSound(next)) total -= 1;
  });

  const stress = stressOf(words[words.length - 1]!);
  if (stress === 'aguda') total += 1;
  if (stress === 'esdrujula') total -= 1;
  return total;
}

export const OCTOSYLLABLE = 8;

/** Lines within one syllable of eight are accepted by poetic licence. */
export function meterVerdict(syllables: number): 'exact' | 'close' | 'off' {
  if (syllables === OCTOSYLLABLE) return 'exact';
  return Math.abs(syllables - OCTOSYLLABLE) === 1 ? 'close' : 'off';
}
