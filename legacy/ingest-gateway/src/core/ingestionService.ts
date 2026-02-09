import { IdempotencyStore, QueueClient, RateLimiter } from './ports';
import { ConversationEvent, IngestResult } from './types';

export interface IngestionServiceConfig {
  idempotencyTtlSeconds: number;
}

export class IngestionService {
  constructor(
    private readonly idempotencyStore: IdempotencyStore,
    private readonly rateLimiter: RateLimiter,
    private readonly queueClient: QueueClient,
    private readonly config: IngestionServiceConfig,
  ) {}

  async ingest(event: ConversationEvent): Promise<IngestResult> {
    const idempotencyKey = this.buildIdempotencyKey(event.provider_message_id);

    if (await this.idempotencyStore.exists(idempotencyKey)) {
      return { status: 'duplicate' };
    }

    const claimed = await this.idempotencyStore.claim(idempotencyKey, this.config.idempotencyTtlSeconds);
    if (!claimed) {
      return { status: 'duplicate' };
    }

    const withinLimit = await this.rateLimiter.consume(event.tenant_id);
    if (!withinLimit) {
      await this.idempotencyStore.remove(idempotencyKey);
      return { status: 'rate_limited' };
    }

    try {
      await this.queueClient.push({ event });
      return { status: 'accepted', eventId: event.event_id };
    } catch (error) {
      await this.idempotencyStore.remove(idempotencyKey);
      throw error;
    }
  }

  private buildIdempotencyKey(providerMessageId: string): string {
    return `idempotency:${providerMessageId}`;
  }
}
