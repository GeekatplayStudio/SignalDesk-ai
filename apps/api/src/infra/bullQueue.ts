import { Queue } from 'bullmq';
import { createRedisClient } from './redisClient';
import { env } from './env';

export function createIngestQueue() {
  const connection = createRedisClient(env.redisUrl);
  const queue = new Queue(env.redisQueueKey, { connection });
  return { queue, connection };
}
