import { releaseAllModels } from '@/features/engine/contextManager';
import { queryKeys } from '@/shared/query/keys';
import { queryClient } from '@/shared/query/queryClient';

import { deleteModelFiles } from './downloader';
import { MODEL_FILES, MODEL_PACKS, packFiles, type ModelFile, type ModelPackId } from './registry';
import { useModelSettings } from './settingsStore';
import { readFileStatus } from './status';

/** Switches inference to an installed pack. Contexts of the old pack are released first. */
export async function activatePack(packId: ModelPackId): Promise<void> {
  await releaseAllModels();
  useModelSettings.getState().selectPack(packId);
  await queryClient.invalidateQueries({ queryKey: ['models'] });
}

/** Installed weights the active pack does not use (e.g. after switching packs). */
export function findUnusedModelFiles(activePackId: ModelPackId): ModelFile[] {
  const inUse = new Set(packFiles(MODEL_PACKS[activePackId]).map((file) => file.id));
  return Object.values(MODEL_FILES).filter((file) => !inUse.has(file.id) && readFileStatus(file).installed);
}

/** Model files changed on disk: re-read pack status and the device's free space. */
export async function refreshModelQueries(): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['models'] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.device }),
  ]);
}

export async function removeUnusedModels(activePackId: ModelPackId): Promise<void> {
  await releaseAllModels();
  deleteModelFiles(findUnusedModelFiles(activePackId));
  await refreshModelQueries();
}
