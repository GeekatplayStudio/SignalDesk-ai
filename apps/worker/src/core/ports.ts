import { ConversationEvent, QueueEventEnvelope } from './types';

export interface IdempotencyStore {
  exists(key: string): Promise<boolean>;
  claim(key: string, ttlSeconds: number): Promise<boolean>;
  remove(key: string): Promise<void>;
}

export interface RateLimiter {
  consume(tenantId: string): Promise<boolean>;
}

export interface QueueClient {
  push(envelope: QueueEventEnvelope): Promise<void>;
  pop(blockMs: number): Promise<QueueEventEnvelope | null>;
  pushDlq(payload: Record<string, unknown>): Promise<void>;
}

export interface ConversationEventRepository {
  insert(event: ConversationEvent): Promise<void>;
}
