import { useRouter, type Href } from 'expo-router';

/**
 * Goes back, or to `fallback` when there is no history (the screen was opened
 * directly, e.g. from a link). A bare `router.back()` would leave the user stuck.
 */
export function useGoBack(fallback: Href = '/') {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace(fallback));
}
