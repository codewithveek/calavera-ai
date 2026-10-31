import { withTransaction } from '@/db/database';
import { insertMemory } from '@/features/memories/repo';
import { prepareMemory } from '@/features/memories/service';
import { deleteImage, persistOfrendaImage } from '@/features/mirror/imagePrep';
import type { HeirloomAnalysis } from '@/features/mirror/analyzer';
import type { ModelPack } from '@/features/models/registry';

import { deleteOfrendaItem, insertOfrendaItem } from './repo';
import { TIERS } from './tiers';
import type { OfrendaItem } from './types';

export interface SaveHeirloomInput {
  profileId: number;
  analysis: HeirloomAnalysis;
  /** Optional family context: why this object matters. */
  note: string;
}

/**
 * Places a scanned heirloom on the ofrenda and feeds it into the memory
 * archive, so the Verse Engine can later weave it into a calaverita.
 */
export async function saveHeirloom(pack: ModelPack, { profileId, analysis, note }: SaveHeirloomInput): Promise<number> {
  const body = [
    `Heirloom on the ofrenda (${TIERS[analysis.tier].name} tier): ${analysis.objectName}.`,
    analysis.description,
    note.trim(),
  ]
    .filter(Boolean)
    .join(' ');

  // Embed before opening the transaction: inference must not hold a write lock.
  const prepared = await prepareMemory(pack, { profileId, source: 'heirloom', body });
  const imageUri = persistOfrendaImage(analysis.imageUri);

  try {
    return await withTransaction(async (db) => {
      const memoryId = await insertMemory(db, prepared);
      return insertOfrendaItem(db, {
        profileId,
        memoryId,
        name: analysis.objectName,
        description: analysis.description,
        tier: analysis.tier,
        meaning: analysis.meaning,
        imageUri,
      });
    });
  } catch (error) {
    deleteImage(imageUri);
    throw error;
  }
}

export async function removeOfrendaItem(item: OfrendaItem): Promise<void> {
  await deleteOfrendaItem(item.id);
  deleteImage(item.imageUri);
}
