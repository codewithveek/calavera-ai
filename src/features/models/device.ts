import * as Device from 'expo-device';
import { Paths } from 'expo-file-system';

import { bytesToGiB } from '@/shared/lib/format';

import { MODEL_PACKS, type ModelPackId } from './registry';

export interface DeviceProfile {
  modelName: string;
  totalMemoryGiB: number;
  freeDiskBytes: number;
  recommendedPackId: ModelPackId;
  /** Phones with this much RAM can keep the writer and the vision model resident together. */
  canHoldTwoHeavyModels: boolean;
}

/** Unknown RAM is treated as a 4 GB phone so we never over-commit memory. */
const FALLBACK_MEMORY_GIB = 4;
const TWO_HEAVY_MODELS_GIB = 7.5;

export function getTotalMemoryGiB(): number {
  return Device.totalMemory ? bytesToGiB(Device.totalMemory) : FALLBACK_MEMORY_GIB;
}

export function recommendPack(totalMemoryGiB: number): ModelPackId {
  return totalMemoryGiB >= MODEL_PACKS.standard.minRamGiB ? 'standard' : 'lite';
}

export function canHoldTwoHeavyModels(totalMemoryGiB = getTotalMemoryGiB()): boolean {
  return totalMemoryGiB >= TWO_HEAVY_MODELS_GIB;
}

export function readDeviceProfile(): DeviceProfile {
  const totalMemoryGiB = getTotalMemoryGiB();
  return {
    modelName: Device.modelName ?? 'This device',
    totalMemoryGiB,
    freeDiskBytes: Paths.availableDiskSpace,
    recommendedPackId: recommendPack(totalMemoryGiB),
    canHoldTwoHeavyModels: canHoldTwoHeavyModels(totalMemoryGiB),
  };
}
