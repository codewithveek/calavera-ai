import { useMutation } from '@tanstack/react-query';

import { useActivePack } from '@/features/models/hooks';

import { analyzeHeirloom } from './analyzer';
import { prepareForVision, type PreparedImage } from './imagePrep';

/** Photo → 512px JPEG → on-device vision model → ofrenda placement. */
export function useHeirloomAnalysis() {
  const pack = useActivePack();
  return useMutation({
    mutationFn: async (photo: PreparedImage) => {
      const prepared = await prepareForVision(photo);
      return analyzeHeirloom(pack, prepared.uri);
    },
  });
}
