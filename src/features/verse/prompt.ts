import type { Profile } from '@/features/profiles/types';

import type { Tone } from './tones';

/** The scratchpad tag the model plans its rhymes in; hidden from the user. */
export const SCRATCHPAD_TAG = 'rimas';

/**
 * Culturally anchored instructions (Module B of the masterplan). This block is
 * identical for every request, so llama.cpp reuses its KV cache across
 * generations and only the per-person context needs prefill.
 */
const CALAVERITA_RULES = `You are an expert in Mexican Día de los Muertos traditions. Your only task is to write a traditional "calaverita literaria" about the person described below.

RULES:
1. Language: write the poem exclusively in Spanish.
2. Tone: witty and satirical about the person's habits or trade, always with love, never with malice.
3. Characters: the person and Death, who comes to take them to the underworld.
4. Structure: exactly two or three stanzas. Each stanza is a quatrain (four lines).
5. Meter and rhyme: aim for eight syllables per line (octosílabo) with a clear rhyme scheme (ABAB or ABBA).

OUTPUT FORMAT:
First, plan inside <${SCRATCHPAD_TAG}></${SCRATCHPAD_TAG}> on ONE line: four pairs of rhyming Spanish words you will use.
Then write ONLY the poem: lines separated by line breaks, stanzas separated by a blank line. No title, no introduction, no explanation.`;

export interface VerseContext {
  profile: Profile;
  memories: readonly string[];
  ofrendaItems: readonly string[];
  focus: string;
}

function describePerson({ profile, memories, ofrendaItems, focus }: VerseContext): string {
  const lines = [`Name: ${profile.name}`];
  if (profile.relation) lines.push(`Relationship to the family: ${profile.relation}`);
  if (profile.lifeSpan) lines.push(`Years: ${profile.lifeSpan}`);
  if (profile.essence) lines.push(`Who they were: ${profile.essence}`);
  if (focus.trim()) lines.push(`Be sure to mention: ${focus.trim()}`);
  if (ofrendaItems.length) lines.push(`On their ofrenda: ${ofrendaItems.join(', ')}`);
  if (memories.length) {
    lines.push('Family memories:');
    memories.forEach((memory) => lines.push(`- ${memory}`));
  }
  return lines.join('\n');
}

export function buildCalaveritaPrompt(context: VerseContext, tone: Tone, figure: string): string {
  return `${CALAVERITA_RULES}

TONE: ${tone.label} (${tone.english}). ${tone.directive}
DEATH APPEARS AS: ${figure}.

ABOUT THE PERSON:
${describePerson(context)}`;
}
