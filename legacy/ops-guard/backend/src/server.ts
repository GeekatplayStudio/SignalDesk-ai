import express, { Request, Response } from 'express';
import cors from 'cors';
import { trace } from '@opentelemetry/api';
import { startTelemetry } from './otel';
import { chaosConfig, chaosMiddleware, sleep } from './chaos';
import { metrics } from './aggregator';
import { logger } from './logger';

// Boot instrumentation first
startTelemetry();
metrics.startAggregation();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// --- Types ---
type TraceSummary = {
  timestamp: string;
  msg: string;
  trace_id: string;
  duration: number;
  level: 'info' | 'error';
  error?: string;
};

const recentTraces: TraceSummary[] = [];
const MAX_TRACES = 200;

const recordTrace = (traceEntry: TraceSummary) => {
  recentTraces.unshift(traceEntry);
  if (recentTraces.length > MAX_TRACES) {
    recentTraces.pop();
  }
};

// --- Helpers ---
const simulateDependency = async (name: string, baseDurationMs: number) => {
  const tracer = trace.getTracer('payment-gateway');
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (name === 'Redis' && chaosConfig.injectError) {
        throw new Error('Redis Connection Failed');
      }

      if (name === 'Bank API' && chaosConfig.injectLatency) {
        await sleep(2000);
      }

      await sleep(baseDurationMs);
      span.addEvent(`${name} success`);
      return { success: true };
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
};

// --- Routes ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/chaos', (_req, res) => {
  res.json(chaosConfig);
});

app.post('/chaos', (req, res) => {
  const { injectLatency, injectError, trafficFlood, circuitBreakerEnabled } = req.body;

  if (injectLatency !== undefined) chaosConfig.injectLatency = Boolean(injectLatency);
  if (injectError !== undefined) chaosConfig.injectError = Boolean(injectError);
  if (trafficFlood !== undefined) chaosConfig.trafficFlood = Boolean(trafficFlood);
  if (circuitBreakerEnabled !== undefined) chaosConfig.circuitBreakerEnabled = Boolean(circuitBreakerEnabled);

  logger.info({ msg: 'Chaos config updated', config: chaosConfig });
  res.json({ status: 'ok', config: chaosConfig });
});

app.get('/metrics', (_req, res) => {
  res.json(metrics.currentMetrics);
});

app.get('/traces', (_req, res) => {
  res.json(recentTraces);
});

const processPaymentHandler = async (_req: Request, res: Response) => {
  const tracer = trace.getTracer('payment-gateway');
  const startTime = Date.now();

  await tracer.startActiveSpan('process_payment', async (span) => {
    try {
      if (res.locals.forceError && !chaosConfig.circuitBreakerEnabled) {
        throw new Error('Upstream Timeout');
      } else if (res.locals.forceError && chaosConfig.circuitBreakerEnabled) {
        logger.warn({ msg: 'Circuit Breaker prevented upstream timeout' });
      }

      await simulateDependency('validate_cart', 50);

      if (chaosConfig.circuitBreakerEnabled && chaosConfig.injectError) {
        logger.warn({ msg: 'Circuit Breaker: Skipping Fraud Check' });
      } else {
        await simulateDependency('Redis', 20);
      }

      await simulateDependency('Bank API', 400);

      const duration = Date.now() - startTime;
      metrics.recordRequest(duration, false);

      const logEntry: TraceSummary = {
        level: 'info',
        msg: 'Payment processed successfully',
        trace_id: span.spanContext().traceId,
        duration,
        timestamp: new Date().toISOString(),
      };

      logger.info(logEntry);
      recordTrace(logEntry);

      res.json({ status: 'success', traceId: span.spanContext().traceId });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      metrics.recordRequest(duration, true);

      const logEntry: TraceSummary = {
        level: 'error',
        msg: 'Payment failed',
        error: error.message,
        trace_id: span.spanContext().traceId,
        duration,
        timestamp: new Date().toISOString(),
      };

      logger.error(logEntry);
      recordTrace(logEntry);

      res.status(500).json({ error: error.message, traceId: span.spanContext().traceId });
    } finally {
      // Mark root span status after we already returned response
    }

    span.end();
  });
};

app.post('/process-payment', chaosMiddleware, processPaymentHandler);

// --- Traffic Simulator ---
let trafficTimer: NodeJS.Timeout | null = null;

/* istanbul ignore next -- exercised in manual load tests */
const startTraffic = () => {
  if (trafficTimer) return;
  trafficTimer = setInterval(() => {
    const burst = chaosConfig.trafficFlood ? 5 : 1;
    for (let i = 0; i < burst; i++) {
      fetch(`http://localhost:${PORT}/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100 }),
      }).catch(() => undefined);
    }
  }, 200); // 5 batches/sec => ~5 rps normal, ~25 rps flood
};

const stopTraffic = () => {
  if (trafficTimer) {
    clearInterval(trafficTimer);
    trafficTimer = null;
  }
};

/* istanbul ignore next -- enabled only in integration runs */
const shouldAutoTraffic = process.env.AUTO_TRAFFIC !== 'false' && process.env.NODE_ENV !== 'test';
/* istanbul ignore next -- enabled only in integration runs */
if (shouldAutoTraffic) {
  startTraffic();
}

// --- Server bootstrap ---
let server: ReturnType<typeof app.listen> | undefined;
/* istanbul ignore next -- integration runtime only */
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`OpsGuard Backend running on port ${PORT}`);
  });
}

export { app, server, startTraffic, stopTraffic, simulateDependency };
export const __testing = { recordTrace, recentTraces };
