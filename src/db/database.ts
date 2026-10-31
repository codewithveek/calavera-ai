import * as SQLite from 'expo-sqlite';

import { createMutex } from '@/shared/lib/mutex';

import { migrate } from './migrations';

const DATABASE_NAME = 'calavera.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
const runTransaction = createMutex();

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  const vec = SQLite.bundledExtensions['sqlite-vec'];
  if (!vec) {
    throw new Error('sqlite-vec is not bundled. Enable withSQLiteVecExtension in app.json.');
  }
  await db.loadExtensionAsync(vec.libPath, vec.entryPoint);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA temp_store = MEMORY;
  `);
  await migrate(db);
  return db;
}

/** Lazily opens the single app database. Safe to call from anywhere, any number of times. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= openDatabase().catch((error) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

/**
 * Runs `task` atomically on the app connection, one transaction at a time.
 * Deliberately not `withExclusiveTransactionAsync`: that opens a new
 * connection, and both sqlite-vec and `foreign_keys` are per-connection (the
 * pragma can't even be enabled after BEGIN), so vec0 writes would fail and
 * ON DELETE CASCADE would silently not run.
 */
export function withTransaction<T>(task: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  return runTransaction(async () => {
    const db = await getDatabase();
    let result: T | undefined;
    await db.withTransactionAsync(async () => {
      result = await task(db);
    });
    return result as T;
  });
}

/** Serialises a Float32Array as the little-endian blob sqlite-vec expects. */
export function toVectorBlob(vector: Float32Array): Uint8Array {
  return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}
