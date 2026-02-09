import { env } from './infra/env';
import { PrismaConversationEventRepository } from './infra/prismaConversationEventRepository';
import { createRedisClient } from './infra/redisClient';
import { RedisQueueClient } from './infra/redisQueueClient';
import { ConversationWorker } from './worker';

async function main(): Promise<void> {
  const redis = createRedisClient(env.redisUrl);

  const queueClient = new RedisQueueClient(redis, env.redisQueueKey, env.redisDlqKey);
  const repository = new PrismaConversationEventRepository();

  const worker = new ConversationWorker(queueClient, repository, {
    maxRetries: env.workerMaxRetries,
    baseBackoffMs: env.workerBaseBackoffMs,
    queuePollBlockMs: 1000,
    enableSimulationMode: env.enableSimulationMode,
  });

  const shutdown = async () => {
    worker.stop();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // eslint-disable-next-line no-console
  console.log('MCC-IG worker started');
  await worker.start();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start worker process', error);
  process.exit(1);
});
