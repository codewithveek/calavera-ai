import type { ModelPackId } from '@/features/models/registry';

/** Single source of truth for TanStack Query keys, so invalidation stays consistent. */
export const queryKeys = {
  device: ['device'] as const,
  packStatus: (packId: ModelPackId) => ['models', 'status', packId] as const,
  unusedModels: (activePackId: ModelPackId) => ['models', 'unused', activePackId] as const,
  profiles: ['profiles'] as const,
  profile: (id: number) => ['profiles', id] as const,
  memories: {
    all: ['memories'] as const,
    byProfile: (profileId: number) => ['memories', 'profile', profileId] as const,
    search: (query: string, profileId: number | null) =>
      ['memories', 'search', query, profileId ?? 'all'] as const,
  },
  ofrenda: ['ofrenda'] as const,
  tributes: {
    all: ['tributes'] as const,
    byProfile: (profileId: number) => ['tributes', 'profile', profileId] as const,
    detail: (id: number) => ['tributes', 'detail', id] as const,
  },
};
