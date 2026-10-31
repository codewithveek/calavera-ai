import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from '@/db/database';

import type { OfrendaTier } from './tiers';
import type { OfrendaItem } from './types';

interface OfrendaRow {
  id: number;
  profile_id: number;
  profile_name: string;
  memory_id: number | null;
  name: string;
  description: string;
  tier: OfrendaTier;
  meaning: string;
  image_uri: string;
  created_at: number;
}

export interface NewOfrendaItem {
  profileId: number;
  memoryId: number;
  name: string;
  description: string;
  tier: OfrendaTier;
  meaning: string;
  imageUri: string;
}

export async function insertOfrendaItem(txn: SQLiteDatabase, item: NewOfrendaItem): Promise<number> {
  const result = await txn.runAsync(
    `INSERT INTO ofrenda_items (profile_id, memory_id, name, description, tier, meaning, image_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    item.profileId,
    item.memoryId,
    item.name,
    item.description,
    item.tier,
    item.meaning,
    item.imageUri,
    Date.now(),
  );
  return result.lastInsertRowId;
}

export async function listOfrendaItems(): Promise<OfrendaItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<OfrendaRow>(`
    SELECT o.*, p.name AS profile_name
    FROM ofrenda_items o
    JOIN profiles p ON p.id = o.profile_id
    ORDER BY o.created_at DESC
  `);
  return rows.map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    profileName: row.profile_name,
    memoryId: row.memory_id,
    name: row.name,
    description: row.description,
    tier: row.tier,
    meaning: row.meaning,
    imageUri: row.image_uri,
    createdAt: row.created_at,
  }));
}

export async function listOfrendaNames(profileId: number, limit = 6): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string }>(
    'SELECT name FROM ofrenda_items WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?',
    profileId,
    limit,
  );
  return rows.map((row) => row.name);
}

export async function listOfrendaImageUris(profileId: number): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ image_uri: string }>(
    'SELECT image_uri FROM ofrenda_items WHERE profile_id = ?',
    profileId,
  );
  return rows.map((row) => row.image_uri);
}

export async function deleteOfrendaItem(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM ofrenda_items WHERE id = ?', id);
}
