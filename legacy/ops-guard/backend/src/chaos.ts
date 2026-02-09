import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface ChaosConfig {
  injectLatency: boolean;
  injectError: boolean;
  trafficFlood: boolean; // Simulates high load
  circuitBreakerEnabled: boolean; // Not exactly chaos, but mitigation
}

export const chaosConfig: ChaosConfig = {
  injectLatency: false,
  injectError: false,
  trafficFlood: false,
  circuitBreakerEnabled: false,
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const chaosMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (chaosConfig.injectLatency) {
    logger.warn({ msg: 'Chaos: Injecting 2000ms latency' });
    await sleep(2000);
  }
  if (chaosConfig.injectError) {
    // Flag the downstream handler to fail so we still record metrics/logs.
    res.locals.forceError = true;
  }
  next();
};
