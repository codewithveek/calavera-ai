import { deleteImage } from '@/features/mirror/imagePrep';
import { listOfrendaImageUris } from '@/features/ofrenda/repo';

import { deleteProfile } from './repo';

/** Deletes a loved one, their rows (by cascade) and the heirloom photos stored on disk. */
export async function removeProfile(id: number): Promise<void> {
  const imageUris = await listOfrendaImageUris(id);
  await deleteProfile(id);
  imageUris.forEach(deleteImage);
}
