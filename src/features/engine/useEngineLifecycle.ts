import { useEffect } from 'react';
import { AppState } from 'react-native';

import { BACKGROUND_RELEASE_DELAY_MS } from './config';
import { releaseHeavyModels } from './contextManager';

/**
 * Android's low-memory killer targets large background apps first. After a
 * short grace period in the background we hand the model memory back to the
 * OS; it is reloaded on demand when the user returns and needs it.
 */
export function useEngineLifecycle(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const subscription = AppState.addEventListener('change', (state) => {
      if (timer) clearTimeout(timer);
      timer = null;
      if (state === 'background') {
        timer = setTimeout(() => {
          releaseHeavyModels().catch(() => undefined);
        }, BACKGROUND_RELEASE_DELAY_MS);
      }
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, []);
}
