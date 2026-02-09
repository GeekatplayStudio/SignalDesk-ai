import { chaosConfig, chaosMiddleware, sleep } from '../src/chaos';

describe('chaos middleware', () => {
  afterEach(() => {
    chaosConfig.injectLatency = false;
    chaosConfig.injectError = false;
    chaosConfig.trafficFlood = false;
    chaosConfig.circuitBreakerEnabled = false;
  });

  it('injects latency when enabled', async () => {
    chaosConfig.injectLatency = true;
    const start = Date.now();
    await chaosMiddleware({} as any, { locals: {} } as any, () => undefined);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(1900);
  });

  it('flags forced error when enabled', async () => {
    chaosConfig.injectError = true;
    const res: any = { locals: {} };
    await chaosMiddleware({} as any, res, () => undefined);
    expect(res.locals.forceError).toBe(true);
  });

  it('sleep utility waits approximately requested time', async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });
});
