import { describe, expect, it } from 'vitest';
import { ConversationEventRepository } from '../src/core/ports';
import { ChannelType, ConversationEvent, QueueEventEnvelope } from '../src/core/types';
import {
  InMemoryConversationEventRepository,
  InMemoryQueueClient,
} from '../src/testing/inMemoryAdapters';
import { ConversationWorker } from '../src/worker/worker';

function createEnvelope(): QueueEventEnvelope {
  return {
    event: {
      event_id: 'evt-1',
      provider_message_id: 'provider-1',
      tenant_id: 'tenant-1',
      channel_type: ChannelType.SMS,
      timestamp: '2026-02-09T00:00:00.000Z',
      content: 'hello',
      metadata: { from: '+1', to: '+2' },
      raw_metadata: { tenant_id: 'tenant-1', From: '+1', To: '+2', Body: 'hello' },
    },
  };
}

function createForcedFailureEnvelope(): QueueEventEnvelope {
  return {
    event: {
      ...createEnvelope().event,
      provider_message_id: 'provider-force-fail',
      metadata: {
        simulate_failure: true,
        scenario: 'unit_test',
      },
    },
  };
}

class FlakyRepository implements ConversationEventRepository {
  attempts = 0;

  constructor(private readonly failAttemptsBeforeSuccess: number) {}

  async insert(_event: ConversationEvent): Promise<void> {
    this.attempts += 1;
    if (this.attempts <= this.failAttemptsBeforeSuccess) {
      throw new Error('transient db error');
    }
  }
}

class AlwaysFailRepository implements ConversationEventRepository {
  attempts = 0;

  async insert(_event: ConversationEvent): Promise<void> {
    this.attempts += 1;
    throw new Error('db unavailable');
  }
}

describe('ConversationWorker', () => {
  it('persists a queued event', async () => {
    const queue = new InMemoryQueueClient();
    const repository = new InMemoryConversationEventRepository();
    const worker = new ConversationWorker(queue, repository, {
      maxRetries: 3,
      baseBackoffMs: 0,
      queuePollBlockMs: 1,
    });

    await queue.push(createEnvelope());
    await worker.runOnce();

    expect(repository.events).toHaveLength(1);
    expect(queue.dlq).toHaveLength(0);
  });

  it('retries transient failures and succeeds within retry budget', async () => {
    const queue = new InMemoryQueueClient();
    const repository = new FlakyRepository(2);
    const worker = new ConversationWorker(queue, repository, {
      maxRetries: 3,
      baseBackoffMs: 0,
      queuePollBlockMs: 1,
    });

    await queue.push(createEnvelope());
    await worker.runOnce();

    expect(repository.attempts).toBe(3);
    expect(queue.dlq).toHaveLength(0);
  });

  it('moves event to DLQ after max retries are exhausted', async () => {
    const queue = new InMemoryQueueClient();
    const repository = new AlwaysFailRepository();
    const worker = new ConversationWorker(queue, repository, {
      maxRetries: 3,
      baseBackoffMs: 0,
      queuePollBlockMs: 1,
    });

    await queue.push(createEnvelope());
    await worker.runOnce();

    expect(repository.attempts).toBe(3);
    expect(queue.dlq).toHaveLength(1);
    expect(queue.dlq[0].retries).toBe(3);
    expect(queue.dlq[0].error).toBe('db unavailable');
  });

  it('forces failure in simulation mode and moves event to DLQ', async () => {
    const queue = new InMemoryQueueClient();
    const repository = new InMemoryConversationEventRepository();
    const worker = new ConversationWorker(queue, repository, {
      maxRetries: 3,
      baseBackoffMs: 0,
      queuePollBlockMs: 1,
      enableSimulationMode: true,
    });

    await queue.push(createForcedFailureEnvelope());
    await worker.runOnce();

    expect(repository.events).toHaveLength(0);
    expect(queue.dlq).toHaveLength(1);
    expect(queue.dlq[0].error).toBe('simulation_forced_failure');
    expect(queue.dlq[0].retries).toBe(3);
  });
});
