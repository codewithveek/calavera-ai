import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createRateMeter } from './rate';

describe('createRateMeter', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 0 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('treats the first total as a baseline, so resumed transfers do not spike', () => {
    const rate = createRateMeter(1000, 0.5);
    expect(rate(400_000_000)).toBe(0);
    jest.advanceTimersByTime(1000);
    expect(rate(400_500_000)).toBe(500_000);
  });

  it('ignores samples that arrive before the interval elapses', () => {
    const rate = createRateMeter(1000, 0.5);
    rate(0);
    jest.advanceTimersByTime(1000);
    expect(rate(1000)).toBe(1000);
    jest.advanceTimersByTime(200);
    expect(rate(50_000)).toBe(1000);
  });

  it('smooths changes in throughput', () => {
    const rate = createRateMeter(1000, 0.5);
    rate(0);
    jest.advanceTimersByTime(1000);
    rate(1000);
    jest.advanceTimersByTime(1000);
    expect(rate(4000)).toBe(2000);
  });
});
