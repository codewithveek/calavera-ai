import { create } from 'zustand';

import type { GeneratePhase } from './generator';

export type VersePhase = 'idle' | GeneratePhase | 'error';

interface VerseSession {
  phase: VersePhase;
  /** Raw streamed model output, including the hidden rhyme scratchpad. */
  raw: string;
  /** Raw streamed English translation (the "Spanish + English" second pass). */
  translation: string;
  memoriesUsed: number;
  error: string | null;
}

const INITIAL: VerseSession = { phase: 'idle', raw: '', translation: '', memoriesUsed: 0, error: null };

/** Streaming state lives outside React Query so tokens never churn the cache. */
export const useVerseSession = create<VerseSession>()(() => INITIAL);

export const verseActions = {
  start() {
    useVerseSession.setState({ ...INITIAL, phase: 'retrieving' });
  },
  setPhase(phase: VersePhase) {
    useVerseSession.setState({ phase });
  },
  setMemoriesUsed(memoriesUsed: number) {
    useVerseSession.setState({ memoriesUsed });
  },
  append(chunk: string) {
    useVerseSession.setState((state) => ({ raw: state.raw + chunk }));
  },
  appendTranslation(chunk: string) {
    useVerseSession.setState((state) => ({ translation: state.translation + chunk }));
  },
  fail(error: string) {
    useVerseSession.setState({ phase: 'error', error });
  },
  reset() {
    useVerseSession.setState(INITIAL);
  },
  /** Clears a finished or failed session, leaving a running generation untouched. */
  resetIfIdle() {
    const { phase } = useVerseSession.getState();
    if (phase === 'idle' || phase === 'error') useVerseSession.setState(INITIAL);
  },
};
