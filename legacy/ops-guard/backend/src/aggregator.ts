import { logger } from './logger';

interface RequestRecord {
  timestamp: number;
  duration: number;
  isError: boolean;
}

export class MetricsAggregator {
  private requests: RequestRecord[] = [];
  private readonly WINDOW_SIZE_MS = 60 * 60 * 1000; // 1 hour
  private aggregationTimer?: NodeJS.Timeout;
  private sloTarget = 99.9; // percentage availability target

  // Current calculated metrics
  public currentMetrics = {
    rps: 0,
    errorRate: 0,
    p95Latency: 0,
    burnRate: 0,
    errorBudgetRemaining: 99.9,
  };

  public recordRequest(duration: number, isError: boolean) {
    this.requests.push({
      timestamp: Date.now(),
      duration,
      isError,
    });
  }

  private cleanOldData() {
    const now = Date.now();
    const cutoff = now - this.WINDOW_SIZE_MS;
    // Optimization: Binary search or just filter if array is small enough.
    // For a demo with "Traffic Flood", array might get large.
    // Let's just filter for correctness.
    this.requests = this.requests.filter(r => r.timestamp > cutoff);
  }

  public calculateMetrics() {
    this.cleanOldData();
    const now = Date.now();
    
    // RPS: Calculate over the last 5 seconds for "Instantaneous" RPS or 1 min?
    // Prompt says "Real-time Metrics". Usually 5s or 1m window for rate.
    // Let's use a 5-second window for RPS to make it responsive.
    const rpsWindow = 5000;
    const requestsInWindow = this.requests.filter(r => r.timestamp > now - rpsWindow);
    const rps = requestsInWindow.length / (rpsWindow / 1000);

    // Error Rate: % of errors in the last window (let's say 1 minute for stability).
    // Prompt: "(Errors / Total Requests) * 100"
    const errorWindow = 60000; // 1 minute
    const recentRequests = this.requests.filter(r => r.timestamp > now - errorWindow);
    
    let errorRate = 0;
    if (recentRequests.length > 0) {
      const errorCount = recentRequests.filter(r => r.isError).length;
      errorRate = (errorCount / recentRequests.length) * 100;
    }

    // p95 Latency: 95th percentile of response times in last minute
    let p95Latency = 0;
    if (recentRequests.length > 0) {
      const sortedDurations = recentRequests.map(r => r.duration).sort((a, b) => a - b);
      const index = Math.floor(sortedDurations.length * 0.95);
      p95Latency = sortedDurations[index];
    }

    const errorBudget = 100 - this.sloTarget;
    const burnRate = errorBudget === 0 ? 0 : errorRate / errorBudget;
    const budgetRemaining = Math.max(0, errorBudget - errorRate);

    this.currentMetrics = {
      rps: Math.round(rps), // Round to integer
      errorRate: parseFloat(errorRate.toFixed(2)),
      p95Latency: Math.round(p95Latency),
      burnRate: parseFloat(burnRate.toFixed(2)),
      errorBudgetRemaining: parseFloat(budgetRemaining.toFixed(3)),
    };
    
    // logger.info({ msg: 'Metrics Updated', metrics: this.currentMetrics });
  }

  public startAggregation(intervalMs: number = 5000) {
    if (this.aggregationTimer) return this.aggregationTimer;
    this.aggregationTimer = setInterval(() => this.calculateMetrics(), intervalMs);
    return this.aggregationTimer;
  }

  public stopAggregation() {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = undefined;
    }
  }

  public setSloTarget(target: number) {
    this.sloTarget = target;
  }
}

export const metrics = new MetricsAggregator();
