/**
 * A FIFO async mutex. Tasks run one at a time in the order they were queued,
 * and a failing task never blocks the ones behind it.
 */
export function createMutex() {
  let tail: Promise<unknown> = Promise.resolve();

  return function runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.catch(() => undefined);
    return result;
  };
}

export type RunExclusive = ReturnType<typeof createMutex>;
