import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createThrottle } from './batcher';

describe('createThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 10_000 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('emits the latest value at most once per interval', () => {
    const emitted: number[] = [];
    const throttle = createThrottle((value: number) => emitted.push(value), 150);
    throttle.push(1);
    throttle.push(2);
    throttle.push(3);
    jest.advanceTimersByTime(150);
    expect(emitted).toEqual([1, 3]);
  });

  it('drops a pending value when cancelled', () => {
    const emitted: number[] = [];
    const throttle = createThrottle((value: number) => emitted.push(value), 150);
    throttle.push(1);
    throttle.push(100);
    throttle.cancel();
    jest.advanceTimersByTime(500);
    expect(emitted).toEqual([1]);
  });
});
