import { getDatabase, withTransaction } from '@/db/database';

import type { Profile, ProfileDraft, ProfileSummary } from './types';

interface ProfileRow {
  id: number;
  name: string;
  relation: string;
  life_span: string;
  essence: string;
  created_at: number;
}

interface ProfileSummaryRow extends ProfileRow {
  memory_count: number;
  tribute_count: number;
}

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  name: row.name,
  relation: row.relation,
  lifeSpan: row.life_span,
  essence: row.essence,
  createdAt: row.created_at,
});

export async function listProfiles(): Promise<ProfileSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ProfileSummaryRow>(`
    SELECT p.*,
      (SELECT COUNT(*) FROM memories m WHERE m.profile_id = p.id) AS memory_count,
      (SELECT COUNT(*) FROM tributes t WHERE t.profile_id = p.id) AS tribute_count
    FROM profiles p
    ORDER BY p.created_at DESC
  `);
  return rows.map((row) => ({ ...toProfile(row), memoryCount: row.memory_count, tributeCount: row.tribute_count }));
}

export async function getProfile(id: number): Promise<Profile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM profiles WHERE id = ?', id);
  return row ? toProfile(row) : null;
}

export async function createProfile(draft: ProfileDraft): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO profiles (name, relation, life_span, essence, created_at) VALUES (?, ?, ?, ?, ?)',
    draft.name.trim(),
    draft.relation.trim(),
    draft.lifeSpan.trim(),
    draft.essence.trim(),
    Date.now(),
  );
  return result.lastInsertRowId;
}

/** Vectors live in a virtual table without foreign keys, so they are removed explicitly. */
export function deleteProfile(id: number): Promise<void> {
  return withTransaction(async (db) => {
    await db.runAsync('DELETE FROM memory_vectors WHERE profile_id = ?', id);
    await db.runAsync('DELETE FROM profiles WHERE id = ?', id);
  });
}
