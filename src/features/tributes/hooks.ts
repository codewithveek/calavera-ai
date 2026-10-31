import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/shared/query/keys';

import { deleteTribute, getTribute, listTributes } from './repo';

export function useTribute(id: number) {
  return useQuery({ queryKey: queryKeys.tributes.detail(id), queryFn: () => getTribute(id) });
}

export function useProfileTributes(profileId: number) {
  return useQuery({ queryKey: queryKeys.tributes.byProfile(profileId), queryFn: () => listTributes(profileId) });
}

export function useDeleteTribute() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTribute(id),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.tributes.all }),
        client.invalidateQueries({ queryKey: queryKeys.profiles }),
      ]),
  });
}
