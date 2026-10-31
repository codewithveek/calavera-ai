import type { SQLiteDatabase } from 'expo-sqlite';

import { EMBEDDING_DIMENSIONS } from '@/features/models/registry';

type Migration = (db: SQLiteDatabase) => Promise<void>;

/**
 * Ordered, append-only migrations. Index `n` upgrades the schema from
 * `user_version = n` to `n + 1`. Never edit a migration that has shipped.
 */
const MIGRATIONS: readonly Migration[] = [
  async (db) => {
    await db.execAsync(`
      CREATE TABLE profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        relation TEXT NOT NULL DEFAULT '',
        life_span TEXT NOT NULL DEFAULT '',
        essence TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        source TEXT NOT NULL CHECK (source IN ('story', 'heirloom')),
        body TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX idx_memories_profile ON memories(profile_id, created_at DESC);

      CREATE TABLE memory_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        profile_id INTEGER NOT NULL,
        content TEXT NOT NULL
      );
      CREATE INDEX idx_chunks_memory ON memory_chunks(memory_id);

      -- sqlite-vec index. Partitioning by profile keeps per-ancestor KNN
      -- searches from scanning everyone else's memories.
      CREATE VIRTUAL TABLE memory_vectors USING vec0(
        chunk_id INTEGER PRIMARY KEY,
        profile_id INTEGER PARTITION KEY,
        embedding FLOAT[${EMBEDDING_DIMENSIONS}] distance_metric=cosine
      );

      CREATE TABLE ofrenda_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        memory_id INTEGER REFERENCES memories(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        tier TEXT NOT NULL CHECK (tier IN ('cielo', 'tierra', 'inframundo')),
        meaning TEXT NOT NULL,
        image_uri TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX idx_ofrenda_tier ON ofrenda_items(tier, created_at DESC);

      CREATE TABLE tributes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        tone INTEGER NOT NULL,
        figure TEXT NOT NULL,
        poem TEXT NOT NULL,
        model_label TEXT NOT NULL,
        tokens_per_second REAL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX idx_tributes_profile ON tributes(profile_id, created_at DESC);
    `);
  },
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    const migration = MIGRATIONS[version];
    if (!migration) break;
    // Same connection on purpose: vec0 only exists where sqlite-vec was loaded (see withTransaction).
    await db.withTransactionAsync(async () => {
      await migration(db);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
