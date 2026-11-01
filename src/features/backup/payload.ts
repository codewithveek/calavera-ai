import type { OfrendaTier } from '@/features/ofrenda/tiers';
import type { VerseLanguage } from '@/features/verse/languages';
import { pluralize } from '@/shared/lib/format';
import { UserFacingError } from '@/shared/lib/errors';

/**
 * What a backup holds: people and everything about them. No model weights
 * (a new phone downloads those again) and no search vectors (memories are
 * re-indexed on restore, which keeps the file small and model-independent).
 */
export interface BackupMemory {
  source: 'story' | 'heirloom';
  body: string;
  createdAt: number;
}

export interface BackupOfrendaItem {
  name: string;
  description: string;
  tier: OfrendaTier;
  meaning: string;
  /** Index into the person's `memories` (the heirloom's memory), if any. */
  memoryIndex: number | null;
  /** JPEG, base64. */
  photo: string;
  createdAt: number;
}

export interface BackupTribute {
  tone: number;
  figure: string;
  poem: string;
  language: VerseLanguage;
  translation: string | null;
  modelLabel: string;
  createdAt: number;
}

export interface BackupPerson {
  name: string;
  relation: string;
  lifeSpan: string;
  essence: string;
  createdAt: number;
  memories: BackupMemory[];
  ofrenda: BackupOfrendaItem[];
  tributes: BackupTribute[];
}

export interface BackupPayload {
  kind: 'calavera-archive';
  version: 1;
  createdAt: number;
  people: BackupPerson[];
}

export function parsePayload(json: string): BackupPayload {
  let payload: Partial<BackupPayload> | null = null;
  try {
    payload = JSON.parse(json) as Partial<BackupPayload>;
  } catch {
    // reported below
  }
  if (payload?.kind !== 'calavera-archive' || !Array.isArray(payload.people)) {
    throw new UserFacingError('This backup is damaged and cannot be opened.');
  }
  if (payload.version !== 1) throw new UserFacingError('This backup was made by a newer version of Calavera AI.');
  return payload as BackupPayload;
}

export interface BackupSummary {
  people: string[];
  memories: number;
  heirlooms: number;
  calaveritas: number;
}

export function summarize(payload: BackupPayload): BackupSummary {
  const total = (pick: (person: BackupPerson) => readonly unknown[]) =>
    payload.people.reduce((sum, person) => sum + pick(person).length, 0);
  return {
    people: payload.people.map((person) => person.name),
    memories: total((person) => person.memories),
    heirlooms: total((person) => person.ofrenda),
    calaveritas: total((person) => person.tributes),
  };
}

/** "Abuela Rosa · 3 memories · 2 heirlooms · 2 calaveritas" */
export function describeSummary(summary: BackupSummary): string {
  const names = summary.people.length <= 3 ? summary.people.join(', ') : pluralize(summary.people.length, 'loved one');
  return [
    names,
    pluralize(summary.memories, 'memory', 'memories'),
    pluralize(summary.heirlooms, 'heirloom'),
    pluralize(summary.calaveritas, 'calaverita'),
  ].join(' · ');
}

const normalizeName = (text: string) => text.trim().toLowerCase();

/** Same name and years: the person is already on this phone, so restoring would duplicate them. */
export function isSamePerson(a: { name: string; lifeSpan: string }, b: { name: string; lifeSpan: string }): boolean {
  return normalizeName(a.name) === normalizeName(b.name) && normalizeName(a.lifeSpan) === normalizeName(b.lifeSpan);
}
