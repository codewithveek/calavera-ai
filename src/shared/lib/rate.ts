/**
 * Smoothed throughput meter (exponential moving average), e.g. bytes/second.
 * Feed it monotonically increasing totals; it returns the current rate.
 * The first total is only a baseline, so a resumed transfer starting at
 * 400 MB doesn't read as a 400 MB burst.
 */
export function createRateMeter(sampleIntervalMs = 1000, smoothing = 0.2) {
  let lastTotal: number | null = null;
  let lastTime = 0;
  let rate = 0;

  return (total: number): number => {
    const now = Date.now();
    if (lastTotal === null) {
      lastTotal = total;
      lastTime = now;
      return rate;
    }

    const elapsedMs = now - lastTime;
    if (elapsedMs < sampleIntervalMs) return rate;

    const instant = ((total - lastTotal) * 1000) / elapsedMs;
    rate = rate === 0 ? instant : rate * (1 - smoothing) + instant * smoothing;
    lastTotal = total;
    lastTime = now;
    return rate;
  };
}
