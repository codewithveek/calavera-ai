import { create } from 'zustand';

import type { ModelFileId } from './registry';

export type DownloadPhase = 'idle' | 'downloading' | 'verifying' | 'paused' | 'error' | 'done';

/** Why the system downloader is holding off (it resumes on its own). */
export type DownloadWait = 'network' | 'wifi' | 'retry';

interface DownloadState {
  phase: DownloadPhase;
  /** Files transferring right now (the system downloader runs several at once). */
  activeFileIds: ModelFileId[];
  /** Bytes on disk per file during this session. */
  bytesByFile: Partial<Record<ModelFileId, number>>;
  bytesPerSecond: number;
  waitingFor: DownloadWait | null;
  error: string | null;
}

/** Transient, in-memory progress of the model download (never persisted). */
export const useDownloadStore = create<DownloadState>()(() => ({
  phase: 'idle',
  activeFileIds: [],
  bytesByFile: {},
  bytesPerSecond: 0,
  waitingFor: null,
  error: null,
}));

export const downloadActions = {
  setPhase(phase: DownloadPhase, error: string | null = null) {
    useDownloadStore.setState({ phase, error });
  },
  setActiveFiles(activeFileIds: ModelFileId[]) {
    useDownloadStore.setState({ activeFileIds });
  },
  setProgress(fileId: ModelFileId, bytes: number, bytesPerSecond: number) {
    useDownloadStore.setState((state) => ({
      bytesByFile: { ...state.bytesByFile, [fileId]: bytes },
      bytesPerSecond,
    }));
  },
  /** One update per poll of the system downloader, so the UI re-renders once. */
  setSnapshot(snapshot: Pick<DownloadState, 'activeFileIds' | 'bytesByFile' | 'bytesPerSecond' | 'waitingFor'>) {
    useDownloadStore.setState((state) => ({ ...snapshot, bytesByFile: { ...state.bytesByFile, ...snapshot.bytesByFile } }));
  },
  reset() {
    useDownloadStore.setState({
      phase: 'idle',
      activeFileIds: [],
      bytesByFile: {},
      bytesPerSecond: 0,
      waitingFor: null,
      error: null,
    });
  },
};
