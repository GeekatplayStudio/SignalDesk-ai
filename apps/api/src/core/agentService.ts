import { chooseTool, runTool, ToolCallResult } from './tooling';
import { AssistantPlanner, AssistantPlan, ConversationTurn } from './assistantPlanner';
import { AgentRespondInput } from './agentSchemas';

interface ConversationRecord {
  id: string;
  tenantId?: string | null;
  title?: string | null;
  createdAt?: string | Date;
}

interface MessageRecord {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt?: string | Date;
}

interface ToolCallRecord {
  tool: string;
  status: string;
  [key: string]: unknown;
}

interface AgentRunRecord {
  id: string;
  conversationId: string;
  status: string;
  latencyMs?: number | null;
  createdAt?: string | Date;
  toolCalls: ToolCallRecord[];
}

interface AgentServiceDb {
  conversation: {
    findUnique(args: { where: { id: string } }): Promise<ConversationRecord | null>;
    create(args: { data: { id?: string; tenantId?: string; title?: string } }): Promise<ConversationRecord>;
    findMany(args: { orderBy: { createdAt: 'desc' } }): Promise<ConversationRecord[]>;
  };
  message: {
    create(args: { data: { conversationId: string; role: string; content: string } }): Promise<MessageRecord>;
    findMany(args: {
      where: { conversationId: string };
      orderBy: { createdAt: 'asc' | 'desc' };
      take?: number;
    }): Promise<MessageRecord[]>;
  };
  agentRun: {
    findMany(args: {
      where?: { conversationId: string };
      orderBy: { createdAt: 'desc' };
      include: { toolCalls: true };
    }): Promise<AgentRunRecord[]>;
    create(args: {
      data: {
        conversationId: string;
        status: string;
        latencyMs: number;
        toolCalls: {
          create: {
            tool: string;
            status: string;
            request: Record<string, unknown>;
            response: Record<string, unknown>;
            latencyMs: number;
          };
        };
      };
      include: { toolCalls: true };
    }): Promise<AgentRunRecord>;
  };
}

export interface AgentServiceDependencies {
  db?: AgentServiceDb;
  assistantPlanner?: AssistantPlanner;
  toolRunner?: typeof runTool;
  now?: () => number;
}

export class AgentService {
  private readonly db: AgentServiceDb;
  private readonly assistantPlanner: AssistantPlanner;
  private readonly toolRunner: typeof runTool;
  private readonly now: () => number;

  constructor(deps: AgentServiceDependencies = {}) {
    if (!deps.db) {
      throw new Error('AgentService requires a db dependency');
    }

    this.db = deps.db;
    this.assistantPlanner = deps.assistantPlanner ?? {
      plan: async (input) => {
        const tool = chooseTool(input.latestUserMessage);
        return {
          tool,
          toolInput: { raw_message: input.latestUserMessage },
          assistantReply: `I can help with that. I'm using ${tool.replace(/_/g, ' ')} right now.`,
          reasoning: 'default_service_fallback',
          source: 'rules',
        };
      },
    };
    this.toolRunner = deps.toolRunner ?? runTool;
    this.now = deps.now ?? (() => Date.now());
  }

  async upsertConversation(input: { conversationId?: string; tenantId?: string; title?: string }) {
    if (input.conversationId) {
      const existing = await this.db.conversation.findUnique({ where: { id: input.conversationId } });
      if (existing) return existing;
    }
    return this.db.conversation.create({
      data: { id: input.conversationId, tenantId: input.tenantId, title: input.title },
    });
  }

  async getConversations() {
    return this.db.conversation.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getConversation(id: string) {
    return this.db.conversation.findUnique({ where: { id } });
  }

  async getMessages(conversationId: string) {
    return this.db.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } });
  }

  async getAgentRuns(conversationId?: string) {
    return this.db.agentRun.findMany({
      where: conversationId ? { conversationId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { toolCalls: true },
    });
  }

  async respond(payload: AgentRespondInput) {
    const conversation = await this.upsertConversation({
      conversationId: payload.conversation_id,
      tenantId: payload.tenant_id,
    });

    const userMessage = await this.db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: payload.message,
      },
    });

    const conversationHistory = await this.fetchConversationHistory(conversation.id);
    const planned = await this.assistantPlanner.plan({
      latestUserMessage: payload.message,
      conversationHistory,
    });
    const plan = enforceCriticalHandoff(payload.message, planned);

    const started = this.now();
    const toolResult = this.toolRunner(plan.tool, plan.toolInput);

    const assistantMessage = await this.db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: renderAssistantReply(toolResult, plan),
      },
    });

    const run = await this.db.agentRun.create({
      data: {
        conversationId: conversation.id,
        status: toolResult.status === 'succeeded' ? 'succeeded' : 'failed',
        latencyMs: this.now() - started,
        toolCalls: {
          create: {
            tool: toolResult.tool,
            status: toolResult.status,
            request: toolRequest(plan),
            response: toolResult.output,
            latencyMs: toolResult.latencyMs,
          },
        },
      },
      include: { toolCalls: true },
    });

    return { run, messages: [userMessage, assistantMessage] };
  }

  private async fetchConversationHistory(conversationId: string): Promise<ConversationTurn[]> {
    // Keep context bounded so latency/cost remain stable even on long threads.
    const recent = await this.db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    return recent
      .reverse()
      .map((message) => ({
        role: normalizeRole(message.role),
        content: message.content,
      }));
  }
}

function renderAssistantReply(toolResult: ToolCallResult, plan: AssistantPlan): string {
  const toolSummary = summarizeToolOutcome(toolResult);
  const plannedReply = plan.assistantReply.trim();

  if (toolResult.status === 'failed') {
    return 'I could not complete the requested action; escalating to a human.';
  }

  if (plannedReply.length === 0) {
    return toolSummary;
  }

  if (normalizeText(plannedReply) === normalizeText(toolSummary)) {
    return plannedReply;
  }

  return `${plannedReply}\n\n${toolSummary}`;
}

function enforceCriticalHandoff(message: string, plan: AssistantPlan): AssistantPlan {
  const routedTool = chooseTool(message);
  if (routedTool !== 'handoff_to_human' || plan.tool === 'handoff_to_human') {
    return plan;
  }

  return {
    ...plan,
    tool: 'handoff_to_human',
    toolInput: {
      ...plan.toolInput,
      safety_override: 'critical_risk_handoff',
      original_tool: plan.tool,
    },
    assistantReply: 'I am escalating this to a human teammate so you can get direct help.',
    reasoning: `${plan.reasoning}|critical_risk_handoff`,
  };
}

function summarizeToolOutcome(toolResult: ToolCallResult): string {
  switch (toolResult.tool) {
    case 'check_availability':
      return `I found availability: ${(toolResult.output.slots as string[]).join(', ')}`;
    case 'book_appointment':
      return `Your appointment is booked. Confirmation: ${toolResult.output.confirmation_id}`;
    case 'create_ticket':
      return `I created a support ticket ${toolResult.output.ticket_id}`;
    case 'handoff_to_human':
      return 'I am connecting you to a human agent now.';
    default:
      return 'Completed.';
  }
}

function toolRequest(plan: AssistantPlan): Record<string, unknown> {
  return {
    planner: plan.source,
    model: plan.model ?? null,
    reasoning: plan.reasoning,
    input: plan.toolInput,
  };
}

function normalizeRole(role: string): ConversationTurn['role'] {
  if (role === 'assistant' || role === 'system') {
    return role;
  }
  return 'user';
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
