import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

/** Recites a poem with the device's offline text-to-speech engine. */
export function useRecitation(text: string, language = 'es-MX') {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    if (speaking) {
      stop();
      return;
    }
    setSpeaking(true);
    const done = () => setSpeaking(false);
    Speech.speak(text, { language, rate: 0.9, pitch: 1, onDone: done, onStopped: done, onError: done });
  }, [language, speaking, stop, text]);

  useEffect(
    () => () => {
      Speech.stop();
    },
    [],
  );

  return { speaking, toggle };
}
