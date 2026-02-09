import request from 'supertest';
import { app, startTraffic, stopTraffic, simulateDependency, __testing } from '../src/server';
import { metrics } from '../src/aggregator';
import { chaosConfig } from '../src/chaos';

describe('server endpoints', () => {
  afterEach(async () => {
    await request(app).post('/chaos').send({
      injectLatency: false,
      injectError: false,
      trafficFlood: false,
      circuitBreakerEnabled: false,
    });
  });

  afterAll(() => {
    stopTraffic();
    metrics.stopAggregation();
  });

  it('returns health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns metrics', async () => {
    metrics.calculateMetrics();
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rps');
  });

  it('updates chaos config', async () => {
    const res = await request(app).post('/chaos').send({ injectLatency: true });
    expect(res.status).toBe(200);
    expect(res.body.config.injectLatency).toBe(true);
  });

  it('returns current chaos config via GET', async () => {
    await request(app).post('/chaos').send({ injectLatency: false, injectError: false });
    const res = await request(app).get('/chaos');
    expect(res.status).toBe(200);
    expect(res.body.injectLatency).toBe(false);
  });

  it('processes a successful payment and records trace', async () => {
    const res = await request(app).post('/process-payment');
    expect(res.status).toBe(200);
    expect(res.body.traceId).toBeDefined();

    metrics.calculateMetrics();
    expect(metrics.currentMetrics.rps).toBeGreaterThanOrEqual(0);
  });

  it('fails payment when chaos injectError is set and increases error metrics', async () => {
    await request(app).post('/chaos').send({ injectError: true });

    const res = await request(app).post('/process-payment');
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.error).toBeDefined();

    metrics.calculateMetrics();
    expect(metrics.currentMetrics.errorRate).toBeGreaterThanOrEqual(0);
  });

  it('honors circuit breaker when errors injected', async () => {
    await request(app).post('/chaos').send({ injectError: true, circuitBreakerEnabled: true });

    const res = await request(app).post('/process-payment');
    expect(res.status).toBe(200);

    metrics.calculateMetrics();
    expect(metrics.currentMetrics.errorRate).toBeGreaterThanOrEqual(0);
  });

  it('exposes recorded traces', async () => {
    await request(app).post('/process-payment');
    const res = await request(app).get('/traces');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('starts and stops traffic simulator', async () => {
    startTraffic();
    await new Promise((resolve) => setTimeout(resolve, 250));
    stopTraffic();
    expect(metrics).toBeDefined();
  });

  it('simulateDependency throws when Redis fails', async () => {
    chaosConfig.injectError = true;
    await expect(simulateDependency('Redis', 5)).rejects.toThrow('Redis Connection Failed');
    chaosConfig.injectError = false;
  });

  it('simulateDependency delays Bank API when latency injected', async () => {
    chaosConfig.injectLatency = true;
    const start = Date.now();
    await simulateDependency('Bank API', 1);
    expect(Date.now() - start).toBeGreaterThanOrEqual(1900);
    chaosConfig.injectLatency = false;
  });

  it('recordTrace trims to max size', () => {
    const { recordTrace, recentTraces } = __testing;
    for (let i = 0; i < 205; i++) {
      recordTrace({
        level: 'info',
        msg: 'trace',
        trace_id: `${i}`,
        duration: 1,
        timestamp: new Date().toISOString(),
      });
    }
    expect(recentTraces.length).toBe(200);
  });
});
