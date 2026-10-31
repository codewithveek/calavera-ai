import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase, toVectorBlob } from '@/db/database';

import type { Memory, MemoryMatch, MemorySource } from './types';

interface MemoryRow {
  id: number;
  profile_id: number;
  source: MemorySource;
  body: string;
  created_at: number;
}

interface MatchRow {
  chunk_id: number;
  memory_id: number;
  profile_id: number;
  profile_name: string;
  content: string;
  distance: number;
}

const toMemory = (row: MemoryRow): Memory => ({
  id: row.id,
  profileId: row.profile_id,
  source: row.source,
  body: row.body,
  createdAt: row.created_at,
});

export interface NewMemory {
  profileId: number;
  source: MemorySource;
  body: string;
  chunks: readonly string[];
  vectors: readonly Float32Array[];
}

/**
 * Writes a memory, its chunks and their vectors in one exclusive transaction,
 * so the archive never holds a memory that cannot be retrieved.
 * Accepts a transaction so callers can compose it with other writes.
 */
export async function insertMemory(txn: SQLiteDatabase, memory: NewMemory): Promise<number> {
  const { lastInsertRowId: memoryId } = await txn.runAsync(
    'INSERT INTO memories (profile_id, source, body, created_at) VALUES (?, ?, ?, ?)',
    memory.profileId,
    memory.source,
    memory.body,
    Date.now(),
  );

  for (let index = 0; index < memory.chunks.length; index++) {
    const content = memory.chunks[index];
    const vector = memory.vectors[index];
    if (content === undefined || vector === undefined) continue;
    const { lastInsertRowId: chunkId } = await txn.runAsync(
      'INSERT INTO memory_chunks (memory_id, profile_id, content) VALUES (?, ?, ?)',
      memoryId,
      memory.profileId,
      content,
    );
    await txn.runAsync(
      'INSERT INTO memory_vectors (chunk_id, profile_id, embedding) VALUES (?, ?, ?)',
      chunkId,
      memory.profileId,
      toVectorBlob(vector),
    );
  }
  return memoryId;
}

export async function listMemories(profileId: number): Promise<Memory[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MemoryRow>(
    'SELECT * FROM memories WHERE profile_id = ? ORDER BY created_at DESC',
    profileId,
  );
  return rows.map(toMemory);
}

export async function deleteMemory(memoryId: number): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const chunks = await txn.getAllAsync<{ id: number }>('SELECT id FROM memory_chunks WHERE memory_id = ?', memoryId);
    for (const { id } of chunks) {
      await txn.runAsync('DELETE FROM memory_vectors WHERE chunk_id = ?', id);
    }
    await txn.runAsync('DELETE FROM memories WHERE id = ?', memoryId);
  });
}

/**
 * K-nearest-neighbour search in sqlite-vec. With a profile id, the search is
 * restricted to that ancestor's partition.
 */
export async function searchMemories(
  vector: Float32Array,
  { profileId, limit }: { profileId: number | null; limit: number },
): Promise<MemoryMatch[]> {
  const db = await getDatabase();
  const partitionFilter = profileId === null ? '' : 'AND profile_id = ?';
  const params = profileId === null ? [toVectorBlob(vector), limit] : [toVectorBlob(vector), limit, profileId];

  const rows = await db.getAllAsync<MatchRow>(
    `
    WITH knn AS (
      SELECT chunk_id, distance
      FROM memory_vectors
      WHERE embedding MATCH ? AND k = ? ${partitionFilter}
    )
    SELECT knn.chunk_id, knn.distance, c.memory_id, c.profile_id, c.content, p.name AS profile_name
    FROM knn
    JOIN memory_chunks c ON c.id = knn.chunk_id
    JOIN profiles p ON p.id = c.profile_id
    ORDER BY knn.distance
    `,
    params,
  );

  return rows.map((row) => ({
    chunkId: row.chunk_id,
    memoryId: row.memory_id,
    profileId: row.profile_id,
    profileName: row.profile_name,
    content: row.content,
    similarity: 1 - row.distance,
  }));
}
