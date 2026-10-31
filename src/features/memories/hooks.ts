import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useActivePack } from '@/features/models/hooks';
import { queryKeys } from '@/shared/query/keys';

import { deleteMemory, listMemories } from './repo';
import { addMemory, findRelatedMemories } from './service';
import type { MemorySource } from './types';

const MIN_SEARCH_LENGTH = 3;

export function useMemories(profileId: number) {
  return useQuery({ queryKey: queryKeys.memories.byProfile(profileId), queryFn: () => listMemories(profileId) });
}

export function useAddMemory() {
  const pack = useActivePack();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { profileId: number; source: MemorySource; body: string }) => addMemory(pack, input),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.memories.all }),
        client.invalidateQueries({ queryKey: queryKeys.profiles }),
      ]),
  });
}

export function useDeleteMemory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (memoryId: number) => deleteMemory(memoryId),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.memories.all }),
        client.invalidateQueries({ queryKey: queryKeys.profiles }),
      ]),
  });
}

/** Semantic search over the archive; pass an already-debounced query. */
export function useMemorySearch(query: string, profileId: number | null = null) {
  const pack = useActivePack();
  const trimmed = query.trim();
  return useQuery({
    queryKey: queryKeys.memories.search(trimmed, profileId),
    queryFn: () => findRelatedMemories(pack, trimmed, { profileId, limit: 8 }),
    enabled: trimmed.length >= MIN_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
