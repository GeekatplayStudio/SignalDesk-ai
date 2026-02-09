import { Queue } from 'bullmq';
import { QueueClient } from '../core/ports';
import { QueueEventEnvelope } from '../core/types';

export class BullQueueClient implements QueueClient {
  constructor(private readonly queue: Queue) {}

  async push(envelope: QueueEventEnvelope): Promise<void> {
    await this.queue.add('ingest', envelope, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 200 },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  // BullMQ worker consumes jobs; pop/pushDlq are not used in this implementation.
  async pop(): Promise<QueueEventEnvelope | null> {
    return null;
  }

  async pushDlq(): Promise<void> {
    return undefined;
  }
}
