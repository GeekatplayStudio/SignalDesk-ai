import { describe, expect, it, vi } from 'vitest';
import { AgentService } from './agentService';
import type { AssistantPlan, AssistantPlanner } from './assistantPlanner';
import type { ToolCallResult } from './tooling';

interface DbFixture {
  db: unknown;
  conversationCreate: ReturnType<typeof vi.fn>;
  conversationFindUnique: ReturnType<typeof vi.fn>;
  messageCreate: ReturnType<typeof vi.fn>;
  messageFindMany: ReturnType<typeof vi.fn>;
  agentRunCreate: ReturnType<typeof vi.fn>;
}

function buildDbFixture(options: { existingConversationId?: string; history?: Array<{ role: string; content: string }> } = {}): DbFixture {
  const nowIso = '2026-02-12T13:00:00.000Z';
  let messageCounter = 0;

  const conversationFindUnique = vi.fn(async ({ where }: { where: { id: string } }) => {
    if (options.existingConversationId && where.id === options.existingConversationId) {
      return {
        id: where.id,
        tenantId: 'tenant-1',
        title: null,
        createdAt: nowIso,
      };
    }
    return null;
  });

  const conversationCreate = vi.fn(
    async ({ data }: { data: { id?: string; tenantId?: string; title?: string } }) => ({
      id: data.id ?? 'conv-created',
      tenantId: data.tenantId ?? null,
      title: data.title ?? null,
      createdAt: nowIso,
    }),
  );

  const messageCreate = vi.fn(
    async ({ data }: { data: { conversationId: string; role: string; content: string } }) => ({
      id: `msg-${++messageCounter}`,
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      createdAt: nowIso,
    }),
  );

  const messageFindMany = vi.fn(
    async (args: { where: { conversationId: string }; orderBy: { createdAt: 'desc' }; take: number }) => {
      void args;
      return options.history ?? [];
    },
  );

  const agentRunCreate = vi.fn(
    async ({
      data,
    }: {
      data: {
        conversationId: string;
        status: string;
        latencyMs: number;
        toolCalls: { create: Record<string, unknown> };
      };
      include: { toolCalls: true };
    }) => ({
      id: 'run-1',
      conversationId: data.conversationId,
      status: data.status,
      latencyMs: data.latencyMs,
      createdAt: nowIso,
      toolCalls: [{ id: 'tool-1', createdAt: nowIso, ...data.toolCalls.create }],
    }),
  );

  const db = {
    conversation: {
      findUnique: conversationFindUnique,
      create: conversationCreate,
      findMany: vi.fn(),
    },
    message: {
      create: messageCreate,
      findMany: messageFindMany,
    },
    agentRun: {
      create: agentRunCreate,
      findMany: vi.fn(),
    },
  };

  return {
    db,
    conversationCreate,
    conversationFindUnique,
    messageCreate,
    messageFindMany,
    agentRunCreate,
  };
}

function buildPlanner(plan: AssistantPlan): AssistantPlanner {
  return {
    plan: vi.fn(async () => plan),
  };
}

describe('agent service', () => {
  it('stores planner metadata and returns composed assistant reply for successful tools', async () => {
    const dbFixture = buildDbFixture({
      history: [
        { role: 'assistant', content: 'Previous agent answer' },
        { role: 'user', content: 'Previous customer question' },
      ],
    });

    const plannerPlan: AssistantPlan = {
      tool: 'book_appointment',
      toolInput: { slot: '2026-02-15T10:00:00Z' },
      assistantReply: 'Great, I can book that now.',
      reasoning: 'python_fast_path',
      source: 'python',
      model: 'gpt-4.1-mini',
    };
    const assistantPlanner = buildPlanner(plannerPlan);

    const toolRunner = vi.fn(
      (tool: AssistantPlan['tool'], input: Record<string, unknown>): ToolCallResult => {
        void tool;
        void input;
        return {
          id: 'tool-call-1',
          tool: 'book_appointment',
          status: 'succeeded',
          output: { confirmation_id: 'CONF-123' },
          latencyMs: 14,
        };
      },
    );

    let currentTime = 1000;
    const service = new AgentService({
      db: dbFixture.db as never,
      assistantPlanner,
      toolRunner,
      now: () => {
        currentTime += 25;
        return currentTime;
      },
    });

    const result = await service.respond({
      tenant_id: 'tenant-1',
      message: 'Please book me for tomorrow morning.',
    });

    expect(result.run.status).toBe('succeeded');
    expect(assistantPlanner.plan).toHaveBeenCalledTimes(1);
    const plannerInput = (assistantPlanner.plan as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      latestUserMessage: string;
      conversationHistory: Array<{ role: string; content: string }>;
    };
    expect(plannerInput.conversationHistory[0]?.role).toBe('user');

    expect(dbFixture.agentRunCreate).toHaveBeenCalledTimes(1);
    const createCall = dbFixture.agentRunCreate.mock.calls[0][0] as {
      data: { toolCalls: { create: { request: Record<string, unknown> } } };
    };
    expect(createCall.data.toolCalls.create.request).toMatchObject({
      planner: 'python',
      model: 'gpt-4.1-mini',
      reasoning: 'python_fast_path',
    });

    const assistantMessage = result.messages[1];
    expect(assistantMessage.content).toContain('Great, I can book that now.');
    expect(assistantMessage.content).toContain('Confirmation: CONF-123');
  });

  it('returns escalation text when tool execution fails', async () => {
    const dbFixture = buildDbFixture();
    const assistantPlanner = buildPlanner({
      tool: 'create_ticket',
      toolInput: { priority: 'high' },
      assistantReply: 'I am creating a support case.',
      reasoning: 'fallback',
      source: 'rules',
    });
    const toolRunner = vi.fn(
      (): ToolCallResult => ({
        id: 'tool-call-2',
        tool: 'create_ticket',
        status: 'failed',
        output: { error: 'downstream_unavailable' },
        latencyMs: 4,
      }),
    );

    const service = new AgentService({
      db: dbFixture.db as never,
      assistantPlanner,
      toolRunner,
      now: () => 1000,
    });

    const result = await service.respond({
      message: 'I need help with billing.',
    });

    expect(result.run.status).toBe('failed');
    expect(result.messages[1].content).toBe('I could not complete the requested action; escalating to a human.');
  });

  it('reuses existing conversation when conversation_id already exists', async () => {
    const existingId = 'conv-existing';
    const dbFixture = buildDbFixture({
      existingConversationId: existingId,
    });

    const service = new AgentService({
      db: dbFixture.db as never,
      assistantPlanner: buildPlanner({
        tool: 'check_availability',
        toolInput: {},
        assistantReply: 'Checking availability.',
        reasoning: 'default',
        source: 'rules',
      }),
      toolRunner: vi.fn(
        (): ToolCallResult => ({
          id: 'tool-call-3',
          tool: 'check_availability',
          status: 'succeeded',
          output: { slots: ['2026-02-15T09:00:00Z'] },
          latencyMs: 5,
        }),
      ),
      now: () => 1000,
    });

    await service.respond({
      conversation_id: existingId,
      message: 'Any availability tomorrow?',
    });

    expect(dbFixture.conversationFindUnique).toHaveBeenCalledTimes(1);
    expect(dbFixture.conversationCreate).not.toHaveBeenCalled();
  });
});
