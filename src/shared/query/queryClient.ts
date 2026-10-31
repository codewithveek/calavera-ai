import { QueryClient } from '@tanstack/react-query';

/**
 * All data lives on-device, so:
 * - `networkMode: 'always'` keeps queries running in airplane mode,
 * - `staleTime: Infinity` because mutations invalidate exactly what they change,
 * - no retries: a failing local read will not succeed by trying again.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      staleTime: Infinity,
      gcTime: 5 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      networkMode: 'always',
      retry: false,
    },
  },
});
