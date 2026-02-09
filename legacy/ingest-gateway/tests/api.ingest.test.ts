import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/api/app';
import { IngestionService } from '../src/core/ingestionService';
import {
  InMemoryIdempotencyStore,
  InMemoryQueueClient,
  InMemoryTokenBucketRateLimiter,
} from '../src/testing/inMemoryAdapters';

function buildTestApp(capacity = 10) {
  const idempotency = new InMemoryIdempotencyStore();
  const rateLimiter = new InMemoryTokenBucketRateLimiter(capacity, 0);
  const queue = new InMemoryQueueClient();

  const ingestionService = new IngestionService(idempotency, rateLimiter, queue, {
    idempotencyTtlSeconds: 60,
  });

  return {
    app: createApp(ingestionService),
    queue,
  };
}

describe('ingest API', () => {
  it('accepts an SMS payload and enqueues normalized event', async () => {
    const { app, queue } = buildTestApp();

    const response = await request(app).post('/v1/ingest/sms').send({
      tenant_id: 'tenant-1',
      From: '+10000000001',
      To: '+10000000002',
      Body: 'hello world',
      MessageSid: 'SM-001',
      Timestamp: '2026-02-09T10:00:00.000Z',
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('accepted');
    expect(queue.queue).toHaveLength(1);
    expect(queue.queue[0].event.provider_message_id).toBe('SM-001');
  });

  it('supports non-versioned compatibility routes', async () => {
    const { app } = buildTestApp();

    const response = await request(app).post('/ingest/sms').send({
      tenant_id: 'tenant-1',
      From: '+10000000001',
      To: '+10000000002',
      Body: 'hello',
      MessageSid: 'SM-compat-1',
      Timestamp: '2026-02-09T10:00:00.000Z',
    });

    expect(response.status).toBe(201);
  });

  it('returns duplicate for repeated provider_message_id', async () => {
    const { app, queue } = buildTestApp();
    const payload = {
      tenant_id: 'tenant-1',
      From: '+10000000001',
      To: '+10000000002',
      Body: 'hello world',
      MessageSid: 'SM-dup',
      Timestamp: '2026-02-09T10:00:00.000Z',
    };

    const first = await request(app).post('/v1/ingest/sms').send(payload);
    const second = await request(app).post('/v1/ingest/sms').send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.status).toBe('duplicate');
    expect(queue.queue).toHaveLength(1);
  });

  it('treats provider_message_id as globally idempotent key', async () => {
    const { app, queue } = buildTestApp();

    const first = await request(app).post('/v1/ingest/sms').send({
      tenant_id: 'tenant-a',
      From: '+10000000001',
      To: '+10000000002',
      Body: 'first',
      MessageSid: 'SM-global-idem',
      Timestamp: '2026-02-09T10:00:00.000Z',
    });

    const second = await request(app).post('/v1/ingest/sms').send({
      tenant_id: 'tenant-b',
      From: '+10000000001',
      To: '+10000000002',
      Body: 'second',
      MessageSid: 'SM-global-idem',
      Timestamp: '2026-02-09T10:00:01.000Z',
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.status).toBe('duplicate');
    expect(queue.queue).toHaveLength(1);
  });

  it('enforces per-tenant rate limit', async () => {
    const { app, queue } = buildTestApp(1);

    const first = await request(app).post('/v1/ingest/chat').send({
      tenant_id: 'tenant-rate',
      userId: 'user-1',
      message: 'msg-1',
      chatId: 'chat-1',
      timestamp: '2026-02-09T10:00:00.000Z',
      messageId: 'chat-msg-1',
    });

    const second = await request(app).post('/v1/ingest/chat').send({
      tenant_id: 'tenant-rate',
      userId: 'user-1',
      message: 'msg-2',
      chatId: 'chat-1',
      timestamp: '2026-02-09T10:00:01.000Z',
      messageId: 'chat-msg-2',
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(429);
    expect(queue.queue).toHaveLength(1);
  });

  it('returns 400 for invalid payloads', async () => {
    const { app } = buildTestApp();

    const response = await request(app).post('/v1/ingest/voice').send({
      tenant_id: 'tenant-voice',
      callId: 'call-1',
      transcript_text: '',
      confidence: 2,
      duration: -10,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });

  it('returns 501 for internal count endpoint without diagnostics wiring', async () => {
    const { app } = buildTestApp();

    const response = await request(app).get('/v1/internal/events/count').query({
      provider_message_id: 'SM-1',
    });

    expect(response.status).toBe(501);
  });

  it('returns provider row count when internal diagnostics are wired', async () => {
    const idempotency = new InMemoryIdempotencyStore();
    const rateLimiter = new InMemoryTokenBucketRateLimiter(10, 0);
    const queue = new InMemoryQueueClient();
    const ingestionService = new IngestionService(idempotency, rateLimiter, queue, {
      idempotencyTtlSeconds: 60,
    });

    const app = createApp(ingestionService, {
      getProviderEventCount: async () => 1,
    });

    const response = await request(app).get('/v1/internal/events/count').query({
      provider_message_id: 'SM-1',
    });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
  });

  it('returns 501 for DLQ endpoint without diagnostics wiring', async () => {
    const { app } = buildTestApp();

    const response = await request(app).get('/v1/internal/dlq').query({ limit: 10 });

    expect(response.status).toBe(501);
  });

  it('returns DLQ entries when diagnostics are wired', async () => {
    const idempotency = new InMemoryIdempotencyStore();
    const rateLimiter = new InMemoryTokenBucketRateLimiter(10, 0);
    const queue = new InMemoryQueueClient();
    const ingestionService = new IngestionService(idempotency, rateLimiter, queue, {
      idempotencyTtlSeconds: 60,
    });

    const app = createApp(ingestionService, {
      getDlqEntries: async () => [{ failed_at: '2026-02-09T10:00:00.000Z', error: 'db unavailable' }],
    });

    const response = await request(app).get('/v1/internal/dlq').query({ limit: 10 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.entries)).toBe(true);
    expect(response.body.entries).toHaveLength(1);
  });
});
