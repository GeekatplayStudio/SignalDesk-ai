import { describe, expect, it, vi } from 'vitest';
import { Router } from 'express';
import { createOpsRouter } from './opsRoutes';
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

function getRouteHandler(router: Router, method: 'post' | 'get' | 'patch', path: string) {
  const layer = (router as unknown as { stack: Array<{ route?: unknown }> }).stack.find((entry) => {
    const route = entry.route as { path?: string; methods?: Record<string, boolean> } | undefined;
    return route?.path === path && route.methods?.[method];
  });

  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }

  const route = layer.route as { stack: Array<{ handle: (req: unknown, res: unknown) => Promise<void> | void }> };
  return route.stack[0].handle;
}

function buildService(): AgentService {
  return {
    getAgentRuns: vi.fn().mockResolvedValue([]),
    respond: vi.fn(async (payload: { message: string }) => ({
      run: {
        id: `run-${payload.message.length}`,
        latencyMs: 12,
        toolCalls: [
          {
            tool: payload.message.toLowerCase().includes('issue') ? 'create_ticket' : 'book_appointment',
            status: 'succeeded',
            request: { planner: 'python' },
          },
        ],
      },
      messages: [
        { role: 'user', content: payload.message },
        { role: 'assistant', content: 'ok' },
      ],
    })),
  } as unknown as AgentService;
}

describe('ops routes', () => {
  it('updates simulation mode config via PATCH', async () => {
    const router = createOpsRouter(buildService(), { simulationEnabled: false });
    const patchHandler = getRouteHandler(router, 'patch', '/v1/simulations/config');
    const getHandler = getRouteHandler(router, 'get', '/v1/simulations/config');

    const patchRes = createMockResponse();
    await patchHandler({ body: { enabled: true } }, patchRes);

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body).toMatchObject({ enabled: true });

    const getRes = createMockResponse();
    await getHandler({}, getRes);
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body).toMatchObject({ enabled: true });
  });

  it('validates PATCH simulation config payload', async () => {
    const router = createOpsRouter(buildService(), { simulationEnabled: false });
    const handler = getRouteHandler(router, 'patch', '/v1/simulations/config');
    const res = createMockResponse();

    await handler({ body: {} }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: 'enabled boolean is required' });
  });

  it('returns simulation scenarios', async () => {
    const router = createOpsRouter(buildService(), { simulationEnabled: false });
    const handler = getRouteHandler(router, 'get', '/v1/simulations/scenarios');
    const res = createMockResponse();

    await handler({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      enabled: false,
      scenarios: expect.any(Array),
    });
  });

  it('blocks simulation run when simulation mode is disabled', async () => {
    const router = createOpsRouter(buildService(), { simulationEnabled: false });
    const handler = getRouteHandler(router, 'post', '/v1/simulations/run');
    const res = createMockResponse();

    await handler({ body: { scenario_id: 'booking_happy_path' } }, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ error: 'simulation_mode_disabled' });
  });

  it('starts a simulation run when enabled', async () => {
    const router = createOpsRouter(buildService(), { simulationEnabled: true });
    const handler = getRouteHandler(router, 'post', '/v1/simulations/run');
    const res = createMockResponse();

    await handler({ body: { scenario_id: 'booking_happy_path' } }, res);

    expect(res.statusCode).toBe(202);
    expect(res.body).toMatchObject({
      run: {
        scenarioId: 'booking_happy_path',
        status: 'running',
      },
    });
  });
});
