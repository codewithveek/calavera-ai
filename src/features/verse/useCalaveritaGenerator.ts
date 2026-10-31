import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { stopActiveCompletion } from '@/features/engine/contextManager';
import { useActivePack } from '@/features/models/hooks';
import { createTextBatcher } from '@/shared/lib/batcher';
import { toErrorMessage } from '@/shared/lib/errors';
import { haptics } from '@/shared/lib/haptics';
import { queryKeys } from '@/shared/query/keys';

import { generateCalaverita, type GenerateInput } from './generator';
import { verseActions } from './verseStore';

export function useCalaveritaGenerator() {
  const pack = useActivePack();
  const client = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (input: GenerateInput) => {
      verseActions.start();
      // Tokens arrive far faster than the screen needs; render ~12 times a second.
      const tokens = createTextBatcher(verseActions.append, 80);
      const translationTokens = createTextBatcher(verseActions.appendTranslation, 80);
      try {
        return await generateCalaverita(pack, input, {
          onPhase: verseActions.setPhase,
          onMemoriesUsed: verseActions.setMemoriesUsed,
          onToken: tokens.push,
          onTranslationToken: translationTokens.push,
        });
      } finally {
        tokens.flushNow();
        translationTokens.flushNow();
      }
    },
    onSuccess: async (tributeId) => {
      haptics.success();
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.tributes.all }),
        client.invalidateQueries({ queryKey: queryKeys.profiles }),
      ]);
      verseActions.reset();
      router.push({ pathname: '/tribute/[tributeId]', params: { tributeId: String(tributeId) } });
    },
    onError: (error) => {
      haptics.warning();
      verseActions.fail(toErrorMessage(error));
    },
  });

  return {
    generate: mutation.mutate,
    stop: stopActiveCompletion,
    isGenerating: mutation.isPending,
  };
}
