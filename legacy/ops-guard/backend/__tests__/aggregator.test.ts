import { MetricsAggregator } from '../src/aggregator';

describe('MetricsAggregator', () => {
  test('computes rps, error rate, latency, burn rate, and budget', () => {
    const agg = new MetricsAggregator();

    // 4 requests in last 5s, 1 error, latencies varied
    const now = Date.now();
    const records = [
      { ts: now - 1000, duration: 100, isError: false },
      { ts: now - 2000, duration: 200, isError: true },
      { ts: now - 3000, duration: 900, isError: false },
      { ts: now - 4000, duration: 150, isError: false },
    ];

    // @ts-expect-error private access for test setup
    agg.requests = records.map((r) => ({
      timestamp: r.ts,
      duration: r.duration,
      isError: r.isError,
    }));

    agg.calculateMetrics();
    const { rps, errorRate, p95Latency, burnRate, errorBudgetRemaining } = agg.currentMetrics;

    expect(rps).toBe(1); // 4 req over 5s => 0.8 -> rounded to 1
    expect(errorRate).toBeCloseTo(25);
    expect(p95Latency).toBe(900);
    expect(burnRate).toBeCloseTo(25 / 0.1, 1);
    expect(errorBudgetRemaining).toBe(0);
  });

  test('startAggregation is idempotent and stoppable', () => {
    const agg = new MetricsAggregator();
    const timer1 = agg.startAggregation(5);
    const timer2 = agg.startAggregation(5);
    expect(timer2).toBe(timer1);
    // Allow the interval to tick at least once
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        agg.stopAggregation();
        resolve();
      }, 12);
    });
  });

  test('handles zero error budget safely', () => {
    const agg = new MetricsAggregator();
    agg.setSloTarget(100); // zero error budget
    agg.recordRequest(100, false);
    agg.calculateMetrics();
    expect(agg.currentMetrics.burnRate).toBe(0);
  });
});
