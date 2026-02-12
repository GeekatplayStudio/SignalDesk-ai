import { randomUUID } from 'crypto';

export type ToolName = 'check_availability' | 'book_appointment' | 'create_ticket' | 'handoff_to_human';

export interface ToolCallRequest {
  id: string;
  tool: ToolName;
  input: Record<string, unknown>;
}

export interface ToolCallResult {
  id: string;
  tool: ToolName;
  status: 'succeeded' | 'failed';
  output: Record<string, unknown>;
  latencyMs: number;
}

export function runTool(tool: ToolName, input: Record<string, unknown>): ToolCallResult {
  const start = Date.now();
  void input;

  const handlers: Record<ToolName, () => Record<string, unknown>> = {
    check_availability: () => ({ available: true, slots: ['2026-02-10T10:00Z', '2026-02-10T14:00Z'] }),
    book_appointment: () => ({ confirmation_id: randomUUID(), status: 'booked' }),
    create_ticket: () => ({ ticket_id: `T-${Math.floor(Math.random() * 100000)}` }),
    handoff_to_human: () => ({ escalated: true, queue: 'support' }),
  };

  let output: Record<string, unknown>;
  try {
    output = handlers[tool]();
    return {
      id: randomUUID(),
      tool,
      status: 'succeeded',
      output,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      id: randomUUID(),
      tool,
      status: 'failed',
      output: { error: (error as Error).message },
      latencyMs: Date.now() - start,
    };
  }
}

export function chooseTool(message: string): ToolName {
  const text = message.toLowerCase();
  if (text.includes('schedule') || text.includes('book')) return 'book_appointment';
  if (text.includes('availability') || text.includes('open')) return 'check_availability';
  if (text.includes('ticket') || text.includes('issue')) return 'create_ticket';
  if (text.includes('human') || text.includes('agent')) return 'handoff_to_human';
  return 'check_availability';
}
