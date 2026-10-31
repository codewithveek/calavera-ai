import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/query/keys';

import { readDeviceProfile } from './device';
import { findUnusedModelFiles } from './packLifecycle';
import { MODEL_PACKS, type ModelPack, type ModelPackId } from './registry';
import { useModelSettings } from './settingsStore';
import { readPackStatus } from './status';

export function useDeviceProfile() {
  return useQuery({
    queryKey: queryKeys.device,
    queryFn: async () => readDeviceProfile(),
    staleTime: 30_000,
  });
}

export function usePackStatus(packId: ModelPackId | null) {
  return useQuery({
    queryKey: queryKeys.packStatus(packId ?? 'lite'),
    queryFn: async () => readPackStatus(packId ?? 'lite'),
    enabled: packId !== null,
  });
}

/** Installed weights the active pack no longer uses; refreshed by any `['models']` invalidation. */
export function useUnusedModelFiles(activePackId: ModelPackId | null) {
  return useQuery({
    queryKey: queryKeys.unusedModels(activePackId ?? 'lite'),
    queryFn: async () => findUnusedModelFiles(activePackId ?? 'lite'),
    enabled: activePackId !== null,
  });
}

/** True once the user's chosen pack is fully installed and verified. */
export function useModelsReady(): { ready: boolean; isPending: boolean } {
  const selected = useModelSettings((state) => state.selectedPackId);
  const { data, isPending } = usePackStatus(selected);
  if (selected === null) return { ready: false, isPending: false };
  return { ready: data?.ready ?? false, isPending };
}

/** The installed pack used for inference. Only call below the readiness guard. */
export function useActivePack(): ModelPack {
  const selected = useModelSettings((state) => state.selectedPackId);
  return MODEL_PACKS[selected ?? 'lite'];
}
