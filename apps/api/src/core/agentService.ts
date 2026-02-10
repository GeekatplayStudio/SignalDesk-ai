import { Prisma, prisma } from '@agentops/db';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { chooseTool, runTool, ToolCallResult, ToolName } from './tooling';

export const agentRespondSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  message: z.string().min(1),
});

export class AgentService {
  async upsertConversation(input: { conversationId?: string; tenantId?: string; title?: string }) {
    if (input.conversationId) {
      const existing = await prisma.conversation.findUnique({ where: { id: input.conversationId } });
      if (existing) return existing;
    }
    return prisma.conversation.create({ data: { id: input.conversationId, tenantId: input.tenantId, title: input.title } });
  }

  async getConversations() {
    return prisma.conversation.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getConversation(id: string) {
    return prisma.conversation.findUnique({ where: { id } });
  }

  async getMessages(conversationId: string) {
    return prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } });
  }

  async getAgentRuns(conversationId?: string) {
    return prisma.agentRun.findMany({
      where: conversationId ? { conversationId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { toolCalls: true },
    });
  }

  async respond(payload: z.infer<typeof agentRespondSchema>) {
    const conversation = await this.upsertConversation({
      conversationId: payload.conversation_id,
      tenantId: payload.tenant_id,
    });

    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: payload.message,
      },
    });

    const tool: ToolName = chooseTool(payload.message);
    const started = Date.now();
    const toolResult = runTool(tool, {});

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: renderAssistantReply(toolResult),
      },
    });

    const run = await prisma.agentRun.create({
      data: {
        conversationId: conversation.id,
        status: toolResult.status === 'succeeded' ? 'succeeded' : 'failed',
        latencyMs: Date.now() - started,
        toolCalls: {
          create: {
        tool: toolResult.tool,
        status: toolResult.status,
        request: {},
        response: toolResult.output as any,
        latencyMs: toolResult.latencyMs,
      },
    },
      },
      include: { toolCalls: true },
    });

    return { run, messages: [userMessage, assistantMessage] };
  }
}

function renderAssistantReply(toolResult: ToolCallResult): string {
  if (toolResult.status === 'failed') {
    return 'I could not complete the requested action; escalating to a human.';
  }

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
