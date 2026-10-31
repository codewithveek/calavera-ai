import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/query/keys';

import { createProfile, getProfile, listProfiles } from './repo';
import { removeProfile } from './service';
import type { ProfileDraft } from './types';

export function useProfiles() {
  return useQuery({ queryKey: queryKeys.profiles, queryFn: listProfiles });
}

export function useProfile(id: number) {
  return useQuery({ queryKey: queryKeys.profile(id), queryFn: () => getProfile(id) });
}

export function useCreateProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draft: ProfileDraft) => createProfile(draft),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.profiles }),
  });
}

export function useDeleteProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => removeProfile(id),
    // A profile cascades to its memories, ofrenda items and tributes.
    onSuccess: () => client.invalidateQueries(),
  });
}
