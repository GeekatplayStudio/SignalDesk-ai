import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${name}`);
  }

  return parsed;
}

function optionalString(name: string): string | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  throw new Error(`Invalid boolean for environment variable ${name}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appName: process.env.APP_NAME ?? 'Geekatplay Studio',
  port: optionalNumber('PORT', 3005),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL'),
  pythonPlannerUrl: optionalString('PYTHON_PLANNER_URL'),
  pythonPlannerTimeoutMs: optionalNumber('PYTHON_PLANNER_TIMEOUT_MS', 1500),
  pythonPlannerFailureCooldownMs: optionalNumber('PYTHON_PLANNER_FAILURE_COOLDOWN_MS', 3000),
  openAiApiKey: optionalString('OPENAI_API_KEY'),
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  openAiTimeoutMs: optionalNumber('OPENAI_TIMEOUT_MS', 8000),
  redisQueueKey: process.env.REDIS_QUEUE_KEY ?? 'queue:conversations',
  redisDlqKey: process.env.REDIS_DLQ_KEY ?? 'dlq:conversations',
  idempotencyTtlSeconds: optionalNumber('IDEMPOTENCY_TTL_SECONDS', 60 * 60 * 24),
  rateLimitCapacity: optionalNumber('RATE_LIMIT_CAPACITY', 100),
  rateLimitRefillRatePerSecond: optionalNumber('RATE_LIMIT_REFILL_RATE', 50),
  workerMaxRetries: optionalNumber('WORKER_MAX_RETRIES', 3),
  workerBaseBackoffMs: optionalNumber('WORKER_BASE_BACKOFF_MS', 100),
  enableInternalEndpoints: optionalBoolean('ENABLE_INTERNAL_ENDPOINTS', true),
  enableCors: optionalBoolean('ENABLE_CORS', true),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  enableSimulationMode: optionalBoolean('ENABLE_SIMULATION_MODE', false),
};
