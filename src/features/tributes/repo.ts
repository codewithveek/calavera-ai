import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/db/database';

import type { VerseLanguage } from '@/features/verse/languages';

import type { NewTribute, Tribute } from './types';

interface TributeRow {
  id: number;
  profile_id: number;
  profile_name: string;
  profile_relation: string;
  profile_life_span: string;
  tone: number;
  figure: string;
  poem: string;
  language: VerseLanguage;
  translation: string | null;
  model_label: string;
  tokens_per_second: number | null;
  created_at: number;
}

const SELECT_TRIBUTE = `
  SELECT t.*, p.name AS profile_name, p.relation AS profile_relation, p.life_span AS profile_life_span
  FROM tributes t
  JOIN profiles p ON p.id = t.profile_id
`;

const toTribute = (row: TributeRow): Tribute => ({
  id: row.id,
  profileId: row.profile_id,
  profileName: row.profile_name,
  profileRelation: row.profile_relation,
  profileLifeSpan: row.profile_life_span,
  tone: row.tone,
  figure: row.figure,
  poem: row.poem,
  language: row.language,
  translation: row.translation,
  modelLabel: row.model_label,
  tokensPerSecond: row.tokens_per_second,
  createdAt: row.created_at,
});

/** `db` lets a restore write inside its transaction. */
export async function insertTribute(
  tribute: NewTribute & { createdAt?: number },
  db?: SQLiteDatabase,
): Promise<number> {
  const target = db ?? (await getDatabase());
  const result = await target.runAsync(
    `INSERT INTO tributes (profile_id, tone, figure, poem, language, translation, model_label, tokens_per_second, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    tribute.profileId,
    tribute.tone,
    tribute.figure,
    tribute.poem,
    tribute.language,
    tribute.translation,
    tribute.modelLabel,
    tribute.tokensPerSecond,
    tribute.createdAt ?? Date.now(),
  );
  return result.lastInsertRowId;
}

export async function getTribute(id: number): Promise<Tribute | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TributeRow>(`${SELECT_TRIBUTE} WHERE t.id = ?`, id);
  return row ? toTribute(row) : null;
}

export async function listTributes(profileId: number): Promise<Tribute[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TributeRow>(
    `${SELECT_TRIBUTE} WHERE t.profile_id = ? ORDER BY t.created_at DESC`,
    profileId,
  );
  return rows.map(toTribute);
}

export async function deleteTribute(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM tributes WHERE id = ?', id);
}
