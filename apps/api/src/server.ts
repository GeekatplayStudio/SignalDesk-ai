import { createApp } from './api/app';
import { IngestionService } from './core/ingestionService';
import { env } from './infra/env';
import { AgentService } from './core/agentService';
import { PrismaConversationEventRepository } from './infra/prismaConversationEventRepository';
import { RedisIdempotencyStore } from './infra/redisIdempotencyStore';
import { RedisQueueClient } from './infra/redisQueueClient';
import { createRedisClient } from './infra/redisClient';
import { RedisTokenBucketRateLimiter } from './infra/redisTokenBucketRateLimiter';

async function main(): Promise<void> {
  const redis = createRedisClient(env.redisUrl);
  const eventRepository = new PrismaConversationEventRepository();

  const idempotencyStore = new RedisIdempotencyStore(redis);
  const rateLimiter = new RedisTokenBucketRateLimiter(
    redis,
    env.rateLimitCapacity,
    env.rateLimitRefillRatePerSecond,
  );
  const queueClient = new RedisQueueClient(redis, env.redisQueueKey, env.redisDlqKey);

  const ingestionService = new IngestionService(idempotencyStore, rateLimiter, queueClient, {
    idempotencyTtlSeconds: env.idempotencyTtlSeconds,
  });

  const agentService = new AgentService();

  const app = createApp(
    ingestionService,
    {
      getProviderEventCount: env.enableInternalEndpoints
        ? (providerMessageId) => eventRepository.countByProviderMessageId(providerMessageId)
        : undefined,
      getDlqEntries: env.enableInternalEndpoints
        ? async (limit) => {
            const endIndex = Math.max(0, limit - 1);
            const rawEntries = await redis.lrange(env.redisDlqKey, 0, endIndex);
            return rawEntries.map((entry) => parseJsonRecord(entry));
          }
        : undefined,
    },
    {
      enableCors: env.enableCors,
      corsOrigin: env.corsOrigin,
    },
    agentService,
  );
  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`MCC-IG API listening on port ${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await redis.quit();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API process', error);
  process.exit(1);
});

function parseJsonRecord(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed;
  } catch (_error) {
    return { raw };
  }
}
