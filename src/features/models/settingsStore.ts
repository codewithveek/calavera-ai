import type { DownloadPauseState } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ModelFileId, ModelPackId } from './registry';

/** Downloads handed to Android's DownloadManager, so a relaunch reattaches instead of starting over. */
export interface TrackedSystemDownloads {
  packId: ModelPackId;
  ids: Partial<Record<ModelFileId, number>>;
}

interface ModelSettingsState {
  /** `null` until the user picks a pack on first launch. */
  selectedPackId: ModelPackId | null;
  /** Resume tokens for downloads paused in a previous session. */
  pausedDownloads: Partial<Record<ModelFileId, DownloadPauseState>>;
  systemDownloads: TrackedSystemDownloads | null;
  selectPack: (packId: ModelPackId) => void;
  trackSystemDownloads: (downloads: TrackedSystemDownloads | null) => void;
  savePausedDownload: (fileId: ModelFileId, state: DownloadPauseState) => void;
  clearPausedDownload: (fileId: ModelFileId) => void;
}

/**
 * Persisted through expo-sqlite's synchronous key-value store, so the saved
 * pack is available on the very first render (no hydration flash).
 */
const syncStorage = createJSONStorage(() => ({
  getItem: (key: string) => Storage.getItemSync(key),
  setItem: (key: string, value: string) => Storage.setItemSync(key, value),
  removeItem: (key: string) => {
    Storage.removeItemSync(key);
  },
}));

export const useModelSettings = create<ModelSettingsState>()(
  persist(
    (set) => ({
      selectedPackId: null,
      pausedDownloads: {},
      systemDownloads: null,
      selectPack: (packId) => set({ selectedPackId: packId }),
      trackSystemDownloads: (downloads) => set({ systemDownloads: downloads }),
      savePausedDownload: (fileId, state) =>
        set((current) => ({ pausedDownloads: { ...current.pausedDownloads, [fileId]: state } })),
      clearPausedDownload: (fileId) =>
        set((current) => {
          const { [fileId]: _removed, ...rest } = current.pausedDownloads;
          return { pausedDownloads: rest };
        }),
    }),
    {
      name: 'calavera-model-settings',
      storage: syncStorage,
      partialize: ({ selectedPackId, pausedDownloads, systemDownloads }) => ({
        selectedPackId,
        pausedDownloads,
        systemDownloads,
      }),
    },
  ),
);
