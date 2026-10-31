import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { downloadAndActivate, resumeBackgroundDownload, stopCancelsDownload, stopDownload } from './downloadController';
import { useDownloadStore } from './downloadStore';
import { useDeviceProfile, usePackStatus, useUnusedModelFiles } from './hooks';
import { activatePack, removeUnusedModels } from './packLifecycle';
import { MODEL_PACKS, packSizeBytes, type ModelPackId } from './registry';
import { useModelSettings } from './settingsStore';

/**
 * State machine behind the setup screen. The pack being *viewed* is kept
 * separate from the *active* pack, so switching packs never strands the user:
 * a new pack only becomes active once every file is verified.
 */
export function useModelSetup() {
  const router = useRouter();
  const activePackId = useModelSettings((state) => state.selectedPackId);
  const { data: device } = useDeviceProfile();
  const [viewedPackId, setViewedPackId] = useState<ModelPackId | null>(null);
  // A pack Android is downloading in the background (possibly since before a relaunch).
  const backgroundPackId = useModelSettings((state) => state.systemDownloads?.packId ?? null);

  // Pick the background download back up so progress, checking and activation continue here.
  useEffect(() => {
    resumeBackgroundDownload();
  }, []);

  const packId = viewedPackId ?? backgroundPackId ?? activePackId ?? device?.recommendedPackId ?? 'lite';
  const pack = MODEL_PACKS[packId];
  const { data: status } = usePackStatus(packId);
  const { data: unusedFiles = [] } = useUnusedModelFiles(activePackId);
  const phase = useDownloadStore((state) => state.phase);
  const error = useDownloadStore((state) => state.error);
  const isBusy = phase === 'downloading' || phase === 'verifying';
  const isActive = activePackId === packId;
  // A `.part` on disk means a paused or interrupted download (the app may have been killed).
  const hasPartialFile = status?.files.some((file) => file.partialBytes > 0) ?? false;
  const canResume = phase === 'paused' || (phase === 'idle' && hasPartialFile);
  const isReady = status?.ready ?? false;

  const enterAltar = () => router.replace('/');

  const activation = useMutation({
    mutationFn: () => activatePack(packId),
    onSuccess: enterAltar,
  });

  const cleanup = useMutation({
    mutationFn: () => removeUnusedModels(activePackId ?? packId),
  });

  return {
    device,
    pack,
    status,
    phase,
    error,
    isBusy,
    isActive,
    isReady,
    canResume,
    /** Overall progress is pinned to the footer once a download has started. */
    showProgress: !isReady && (isBusy || canResume || (status?.missingBytes ?? 0) < packSizeBytes(pack)),
    totalBytes: packSizeBytes(pack),
    unusedFiles,
    viewPack: (id: ModelPackId) => {
      if (!isBusy) setViewedPackId(id);
    },
    startDownload: () => downloadAndActivate(packId),
    stopDownload,
    /** Background downloads cannot pause: stopping cancels them (and needs a confirmation). */
    stopCancels: stopCancelsDownload(),
    enterAltar,
    activate: activation.mutate,
    isActivating: activation.isPending,
    removeUnused: cleanup.mutate,
    isRemovingUnused: cleanup.isPending,
  };
}
