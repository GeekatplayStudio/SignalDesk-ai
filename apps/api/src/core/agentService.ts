import { randomUUID } from 'crypto';
import { z } from 'zod';
import { chooseTool, runTool, ToolCallResult, ToolName } from './tooling';

export interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
  tenantId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  conversationId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  latencyMs?: number;
  createdAt: string;
  toolCalls: ToolCallResult[];
}

const conversations: Conversation[] = [];
const messages: Message[] = [];
const agentRuns: AgentRun[] = [];

export const agentRespondSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  message: z.string().min(1),
});

export class AgentService {
  createConversation(input: { tenantId?: string; title?: string }): Conversation {
    const conversation: Conversation = {
      id: randomUUID(),
      title: input.title,
      tenantId: input.tenantId,
      createdAt: new Date().toISOString(),
    };
    conversations.push(conversation);
    return conversation;
  }

  getConversations(): Conversation[] {
    return conversations.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getConversation(id: string): Conversation | undefined {
    return conversations.find((c) => c.id === id);
  }

  getMessages(conversationId: string): Message[] {
    return messages.filter((m) => m.conversationId === conversationId);
  }

  getAgentRuns(conversationId?: string): AgentRun[] {
    return conversationId ? agentRuns.filter((r) => r.conversationId === conversationId) : agentRuns;
  }

  async respond(payload: z.infer<typeof agentRespondSchema>): Promise<AgentRun> {
    const conversation = payload.conversation_id
      ? this.getConversation(payload.conversation_id)
      : this.createConversation({ tenantId: payload.tenant_id });

    if (!conversation) {
      throw new Error('conversation_not_found');
    }

    const userMessage: Message = {
      id: randomUUID(),
      conversationId: conversation.id,
      role: 'user',
      content: payload.message,
      createdAt: new Date().toISOString(),
    };
    messages.push(userMessage);

    const tool: ToolName = chooseTool(payload.message);
    const started = Date.now();
    const toolResult = runTool(tool, {});

    const assistantMessage: Message = {
      id: randomUUID(),
      conversationId: conversation.id,
      role: 'assistant',
      content: renderAssistantReply(toolResult),
      createdAt: new Date().toISOString(),
    };
    messages.push(assistantMessage);

    const run: AgentRun = {
      id: randomUUID(),
      conversationId: conversation.id,
      status: toolResult.status === 'succeeded' ? 'succeeded' : 'failed',
      latencyMs: Date.now() - started,
      createdAt: new Date().toISOString(),
      toolCalls: [toolResult],
    };
    agentRuns.push(run);
    return run;
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
