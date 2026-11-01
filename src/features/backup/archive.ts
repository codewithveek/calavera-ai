import { File } from 'expo-file-system';

import { withTransaction } from '@/db/database';
import { insertMemory, listMemories } from '@/features/memories/repo';
import { prepareMemory, type PreparedMemory } from '@/features/memories/service';
import { deleteImage, saveOfrendaPhoto } from '@/features/mirror/imagePrep';
import type { ModelPack } from '@/features/models/registry';
import { insertOfrendaItem, listOfrendaItems } from '@/features/ofrenda/repo';
import { createProfile, getProfile, listProfiles } from '@/features/profiles/repo';
import { insertTribute, listTributes } from '@/features/tributes/repo';

import { isSamePerson, type BackupPayload, type BackupPerson } from './payload';

/** Everyone in the archive, or one loved one ("share with family"). */
export async function collectArchive(profileId?: number): Promise<BackupPayload> {
  const ids = profileId === undefined ? (await listProfiles()).map((profile) => profile.id) : [profileId];
  const items = await listOfrendaItems();
  const people: BackupPerson[] = [];

  for (const id of ids) {
    const profile = await getProfile(id);
    if (!profile) continue;
    const [memories, tributes] = await Promise.all([listMemories(id), listTributes(id)]);
    const memoryIndex = new Map(memories.map((memory, index) => [memory.id, index]));

    const ofrenda: BackupPerson['ofrenda'] = [];
    for (const item of items.filter((candidate) => candidate.profileId === id)) {
      const photo = new File(item.imageUri);
      if (!photo.exists) continue;
      ofrenda.push({
        name: item.name,
        description: item.description,
        tier: item.tier,
        meaning: item.meaning,
        memoryIndex: item.memoryId === null ? null : (memoryIndex.get(item.memoryId) ?? null),
        photo: await photo.base64(),
        createdAt: item.createdAt,
      });
    }

    people.push({
      name: profile.name,
      relation: profile.relation,
      lifeSpan: profile.lifeSpan,
      essence: profile.essence,
      createdAt: profile.createdAt,
      memories: memories.map(({ source, body, createdAt }) => ({ source, body, createdAt })),
      ofrenda,
      tributes: tributes.map(({ tone, figure, poem, language, translation, modelLabel, createdAt }) => ({
        tone,
        figure,
        poem,
        language,
        translation,
        modelLabel,
        createdAt,
      })),
    });
  }

  return { kind: 'calavera-archive', version: 1, createdAt: Date.now(), people };
}

export interface RestoreResult {
  added: string[];
  /** Already on this phone (same name and years), so not duplicated. */
  skipped: string[];
}

/** Re-indexes memories on this phone: no vectors travel in the file. */
async function prepareMemories(
  pack: ModelPack,
  person: BackupPerson,
  onMemoryDone: () => void,
): Promise<(PreparedMemory | null)[]> {
  const prepared: (PreparedMemory | null)[] = [];
  for (const memory of person.memories) {
    // An empty memory (nothing to index) is skipped rather than failing the restore.
    prepared.push(await prepareMemory(pack, { profileId: 0, source: memory.source, body: memory.body }).catch(() => null));
    onMemoryDone();
  }
  return prepared;
}

async function restorePerson(pack: ModelPack, person: BackupPerson, onMemoryDone: () => void): Promise<void> {
  // Inference first: it must not hold the write transaction open.
  const memories = await prepareMemories(pack, person, onMemoryDone);
  const photos = await Promise.all(person.ofrenda.map((item) => saveOfrendaPhoto(item.photo)));

  try {
    await withTransaction(async (db) => {
      const { name, relation, lifeSpan, essence, createdAt } = person;
      const profileId = await createProfile({ name, relation, lifeSpan, essence, createdAt }, db);

      const memoryIds: (number | null)[] = [];
      for (const [index, memory] of memories.entries()) {
        const original = person.memories[index];
        memoryIds.push(
          memory && original ? await insertMemory(db, { ...memory, profileId, createdAt: original.createdAt }) : null,
        );
      }

      for (const [index, item] of person.ofrenda.entries()) {
        await insertOfrendaItem(db, {
          profileId,
          memoryId: item.memoryIndex === null ? null : (memoryIds[item.memoryIndex] ?? null),
          name: item.name,
          description: item.description,
          tier: item.tier,
          meaning: item.meaning,
          imageUri: photos[index]!,
          createdAt: item.createdAt,
        });
      }

      for (const tribute of person.tributes) {
        await insertTribute({ ...tribute, profileId, tokensPerSecond: null }, db);
      }
    });
  } catch (error) {
    photos.forEach(deleteImage);
    throw error;
  }
}

/** Adds everyone in the backup who is not already on this phone. */
export async function restoreArchive(
  pack: ModelPack,
  payload: BackupPayload,
  onProgress: (done: number, total: number) => void,
): Promise<RestoreResult> {
  const existing = await listProfiles();
  const result: RestoreResult = { added: [], skipped: [] };
  const toRestore = payload.people.filter((person) => {
    const duplicate = existing.some((profile) => isSamePerson(profile, person));
    if (duplicate) result.skipped.push(person.name);
    return !duplicate;
  });

  const total = toRestore.reduce((sum, person) => sum + person.memories.length, 0);
  let done = 0;
  onProgress(done, total);
  for (const person of toRestore) {
    await restorePerson(pack, person, () => onProgress(++done, total));
    result.added.push(person.name);
  }
  return result;
}
