/**
 * Coalesces high-frequency string chunks (LLM tokens) into periodic flushes so
 * the UI re-renders at a steady cadence instead of once per token.
 */
export function createTextBatcher(flush: (text: string) => void, intervalMs = 80) {
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  const drain = () => {
    timer = null;
    if (!buffer) return;
    const chunk = buffer;
    buffer = '';
    flush(chunk);
  };

  return {
    push(text: string) {
      buffer += text;
      timer ??= setTimeout(drain, intervalMs);
    },
    /** Emits whatever is buffered immediately. */
    flushNow() {
      if (timer) clearTimeout(timer);
      drain();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      buffer = '';
    },
  };
}

/** Drops calls that arrive faster than `intervalMs`, always keeping the latest value. */
export function createThrottle<T>(emit: (value: T) => void, intervalMs: number) {
  let lastEmit = 0;
  let pending: { value: T } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const fire = () => {
    timer = null;
    if (!pending) return;
    lastEmit = Date.now();
    emit(pending.value);
    pending = null;
  };

  return {
    push(value: T) {
      pending = { value };
      const wait = intervalMs - (Date.now() - lastEmit);
      if (wait <= 0) fire();
      else timer ??= setTimeout(fire, wait);
    },
    flushNow() {
      if (timer) clearTimeout(timer);
      fire();
    },
    /** Drops a pending value, so nothing is emitted after the caller is done. */
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}
