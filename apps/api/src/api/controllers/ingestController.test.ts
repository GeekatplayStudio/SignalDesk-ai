import { describe, expect, it, vi } from 'vitest';
import { createIngestHandler } from './ingestController';
import { chatIngestSchema } from '../../core/schemas';
import { normalizeChat } from '../../core/normalize';
import type { IngestionService } from '../../core/ingestionService';
import type { IngestResult } from '../../core/types';

interface MockResponse {
  statusCode: number;
  body: unknown;
  status(code: number): MockResponse;
  json(payload: unknown): MockResponse;
}

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

function buildHandler(result: IngestResult) {
  const ingestionService = {
    ingest: vi.fn().mockResolvedValue(result),
  } as unknown as IngestionService;

  return createIngestHandler(chatIngestSchema, normalizeChat, ingestionService);
}

describe('ingest controller', () => {
  it('returns 400 for invalid payload', async () => {
    const handler = buildHandler({ status: 'accepted', eventId: 'evt-1' });
    const req = { body: {} };
    const res = createMockResponse();

    await handler(req as never, res as never, vi.fn());

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: 'validation_error' });
  });

  it('maps accepted result to 201', async () => {
    const handler = buildHandler({ status: 'accepted', eventId: 'evt-1' });
    const req = {
      body: {
        tenant_id: 'tenant-a',
        userId: 'u-1',
        message: 'hello',
        chatId: 'c-1',
      },
    };
    const res = createMockResponse();

    await handler(req as never, res as never, vi.fn());

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ status: 'accepted', event_id: 'evt-1' });
  });

  it('maps duplicate and rate-limited results to expected status codes', async () => {
    const duplicateHandler = buildHandler({ status: 'duplicate' });
    const req = {
      body: {
        tenant_id: 'tenant-a',
        userId: 'u-1',
        message: 'hello',
        chatId: 'c-1',
      },
    };
    const duplicateRes = createMockResponse();
    await duplicateHandler(req as never, duplicateRes as never, vi.fn());
    expect(duplicateRes.statusCode).toBe(200);
    expect(duplicateRes.body).toEqual({ status: 'duplicate' });

    const rateLimitedHandler = buildHandler({ status: 'rate_limited' });
    const rateLimitedRes = createMockResponse();
    await rateLimitedHandler(req as never, rateLimitedRes as never, vi.fn());
    expect(rateLimitedRes.statusCode).toBe(429);
    expect(rateLimitedRes.body).toEqual({ error: 'rate limit exceeded' });
  });
});
