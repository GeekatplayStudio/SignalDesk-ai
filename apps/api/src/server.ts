import { createApp } from './api/app';
import { IngestionService } from './core/ingestionService';
import { env } from './infra/env';
import { AgentService } from './core/agentService';
import { prisma } from '../../../packages/db/src/index';
import { createAssistantPlanner } from './core/assistantPlanner';
import { PrismaConversationEventRepository } from './infra/prismaConversationEventRepository';
import { RedisIdempotencyStore } from './infra/redisIdempotencyStore';
import { createRedisClient } from './infra/redisClient';
import { RedisTokenBucketRateLimiter } from './infra/redisTokenBucketRateLimiter';
import { createIngestQueue } from './infra/bullQueue';
import { BullQueueClient } from './infra/bullQueueClient';

async function main(): Promise<void> {
  const redis = createRedisClient(env.redisUrl);
  const eventRepository = new PrismaConversationEventRepository();
  const { queue, connection: queueConnection } = createIngestQueue();
  const queueClient = new BullQueueClient(queue);
  const idempotencyStore = new RedisIdempotencyStore(redis);
  const rateLimiter = new RedisTokenBucketRateLimiter(
    redis,
    env.rateLimitCapacity,
    env.rateLimitRefillRatePerSecond,
  );

  const ingestionService = new IngestionService(idempotencyStore, rateLimiter, queueClient, {
    idempotencyTtlSeconds: env.idempotencyTtlSeconds,
  });

  const assistantPlanner = createAssistantPlanner({
    pythonPlannerUrl: env.pythonPlannerUrl,
    pythonPlannerTimeoutMs: env.pythonPlannerTimeoutMs,
    pythonPlannerFailureCooldownMs: env.pythonPlannerFailureCooldownMs,
    openAiApiKey: env.openAiApiKey,
    openAiModel: env.openAiModel,
    openAiBaseUrl: env.openAiBaseUrl,
    openAiTimeoutMs: env.openAiTimeoutMs,
    appName: env.appName,
  });
  const agentService = new AgentService({ assistantPlanner, db: prisma as never });

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
    console.log(`${env.appName} API listening on port ${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await queue.close();
      await queueConnection.quit();
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
