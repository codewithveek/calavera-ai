import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

export interface RecitationPart {
  text: string;
  /** BCP-47 voice, e.g. "es-MX". */
  language: string;
}

/**
 * Recites a poem (and its translation) with the device's offline
 * text-to-speech engine, each part in its own voice. Utterances queue on
 * Android, so the parts play one after another.
 */
export function useRecitation(parts: readonly RecitationPart[]) {
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
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      Speech.speak(part.text, {
        language: part.language,
        rate: 0.9,
        pitch: 1,
        onDone: isLast ? done : undefined,
        onStopped: done,
        onError: done,
      });
    });
  }, [parts, speaking, stop]);

  useEffect(
    () => () => {
      Speech.stop();
    },
    [],
  );

  return { speaking, toggle };
}
