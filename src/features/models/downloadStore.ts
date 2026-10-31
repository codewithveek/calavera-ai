import { create } from 'zustand';

import type { ModelFileId } from './registry';

export type DownloadPhase = 'idle' | 'downloading' | 'verifying' | 'paused' | 'error' | 'done';

interface DownloadState {
  phase: DownloadPhase;
  currentFileId: ModelFileId | null;
  /** Bytes on disk per file during this session. */
  bytesByFile: Partial<Record<ModelFileId, number>>;
  bytesPerSecond: number;
  error: string | null;
}

/** Transient, in-memory progress of the model download (never persisted). */
export const useDownloadStore = create<DownloadState>()(() => ({
  phase: 'idle',
  currentFileId: null,
  bytesByFile: {},
  bytesPerSecond: 0,
  error: null,
}));

export const downloadActions = {
  setPhase(phase: DownloadPhase, error: string | null = null) {
    useDownloadStore.setState({ phase, error });
  },
  setCurrentFile(fileId: ModelFileId | null) {
    useDownloadStore.setState({ currentFileId: fileId });
  },
  setProgress(fileId: ModelFileId, bytes: number, bytesPerSecond: number) {
    useDownloadStore.setState((state) => ({
      bytesByFile: { ...state.bytesByFile, [fileId]: bytes },
      bytesPerSecond,
    }));
  },
  reset() {
    useDownloadStore.setState({ phase: 'idle', currentFileId: null, bytesByFile: {}, bytesPerSecond: 0, error: null });
  },
};
