import { describe, expect, it, vi } from 'vitest';
import { Router } from 'express';
import { createAgentRouter } from './agentRoutes';
import type { AgentService } from '../core/agentService';

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

function getRouteHandler(router: Router, method: 'post' | 'get', path: string) {
  const layer = (router as unknown as { stack: Array<{ route?: unknown }> }).stack.find((entry) => {
    const route = entry.route as { path?: string; methods?: Record<string, boolean> } | undefined;
    return route?.path === path && route.methods?.[method];
  });

  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }

  const route = layer.route as { stack: Array<{ handle: (req: unknown, res: unknown) => Promise<void> }> };
  return route.stack[0].handle;
}

function buildService() {
  return {
    respond: vi.fn().mockResolvedValue({
      run: { id: 'run-1', status: 'succeeded' },
      messages: [],
    }),
    getConversations: vi.fn().mockResolvedValue([]),
    getConversation: vi.fn().mockResolvedValue(null),
    getMessages: vi.fn().mockResolvedValue([]),
    getAgentRuns: vi.fn().mockResolvedValue([]),
  } as unknown as AgentService;
}

describe('agent routes', () => {
  it('validates /v1/agent/respond request body', async () => {
    const service = buildService();
    const router = createAgentRouter(service);
    const handler = getRouteHandler(router, 'post', '/v1/agent/respond');
    const res = createMockResponse();

    await handler({ body: {} }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: expect.any(Object) });
  });

  it('calls agent service for valid payload', async () => {
    const service = buildService();
    const router = createAgentRouter(service);
    const handler = getRouteHandler(router, 'post', '/v1/agent/respond');
    const res = createMockResponse();

    await handler(
      {
        body: {
          message: 'Need help with booking',
        },
      },
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(service.respond).toHaveBeenCalledTimes(1);
  });
});
