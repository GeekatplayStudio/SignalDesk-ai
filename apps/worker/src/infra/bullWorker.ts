import { Worker, QueueEvents } from 'bullmq';
import { env } from './env';
import { QueueEventEnvelope } from '../core/types';
import { PrismaConversationEventRepository } from './prismaConversationEventRepository';
import { createRedisClient } from './redisClient';

export function startBullWorker() {
  const connection = createRedisClient(env.redisUrl);
  const repository = new PrismaConversationEventRepository();

  const worker = new Worker<QueueEventEnvelope>(env.redisQueueKey, async (job) => {
    const envelope = job.data;
    await repository.insert(envelope.event);
    return { ok: true };
  }, {
    connection,
    concurrency: env.workerConcurrency ?? 5,
  });

  const events = new QueueEvents(env.redisQueueKey, { connection });

  worker.on('failed', (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[worker] job failed ${job?.id}:`, err.message);
  });

  events.on('failed', ({ jobId, failedReason }) => {
    // eslint-disable-next-line no-console
    console.error(`[queue] job failed ${jobId}: ${failedReason}`);
  });

  return { worker, events, connection };
}
