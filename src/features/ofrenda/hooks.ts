import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useActivePack } from '@/features/models/hooks';
import { queryKeys } from '@/shared/query/keys';

import { listOfrendaItems } from './repo';
import { removeOfrendaItem, saveHeirloom, type SaveHeirloomInput } from './service';
import { TIER_ORDER, type OfrendaTier } from './tiers';
import type { OfrendaItem } from './types';

function groupByTier(items: OfrendaItem[]): Record<OfrendaTier, OfrendaItem[]> {
  const grouped = Object.fromEntries(TIER_ORDER.map((tier) => [tier, [] as OfrendaItem[]])) as Record<
    OfrendaTier,
    OfrendaItem[]
  >;
  for (const item of items) grouped[item.tier].push(item);
  return grouped;
}

export function useOfrendaByTier() {
  return useQuery({ queryKey: queryKeys.ofrenda, queryFn: listOfrendaItems, select: groupByTier });
}

export function useSaveHeirloom() {
  const pack = useActivePack();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveHeirloomInput) => saveHeirloom(pack, input),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.ofrenda }),
        client.invalidateQueries({ queryKey: queryKeys.memories.all }),
        client.invalidateQueries({ queryKey: queryKeys.profiles }),
      ]),
  });
}

export function useRemoveOfrendaItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (item: OfrendaItem) => removeOfrendaItem(item),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.ofrenda }),
  });
}
