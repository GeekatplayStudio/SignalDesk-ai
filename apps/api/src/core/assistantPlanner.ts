import { ToolName, chooseTool } from './tooling';

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AssistantPlan {
  tool: ToolName;
  toolInput: Record<string, unknown>;
  assistantReply: string;
  reasoning: string;
  source: 'openai' | 'rules';
  model?: string;
}

export interface AssistantPlannerInput {
  latestUserMessage: string;
  conversationHistory: ConversationTurn[];
}

export interface AssistantPlanner {
  plan(input: AssistantPlannerInput): Promise<AssistantPlan>;
}

export interface AssistantPlannerConfig {
  openAiApiKey?: string;
  openAiModel: string;
  openAiBaseUrl: string;
  openAiTimeoutMs: number;
  appName: string;
  fetchImpl?: typeof fetch;
}

export function createAssistantPlanner(config: AssistantPlannerConfig): AssistantPlanner {
  if (!config.openAiApiKey) {
    return new RuleBasedAssistantPlanner();
  }

  return new OpenAiAssistantPlanner({
    apiKey: config.openAiApiKey,
    model: config.openAiModel,
    baseUrl: config.openAiBaseUrl,
    timeoutMs: config.openAiTimeoutMs,
    appName: config.appName,
    fetchImpl: config.fetchImpl ?? fetch,
  });
}

class RuleBasedAssistantPlanner implements AssistantPlanner {
  async plan(input: AssistantPlannerInput): Promise<AssistantPlan> {
    const tool = chooseTool(input.latestUserMessage);
    return buildRulePlan(tool, input.latestUserMessage, 'keyword_routing');
  }
}

interface OpenAiPlannerRuntimeConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs: number;
  appName: string;
  fetchImpl: typeof fetch;
}

interface ChatCompletionsResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

class OpenAiAssistantPlanner implements AssistantPlanner {
  constructor(private readonly config: OpenAiPlannerRuntimeConfig) {}

  async plan(input: AssistantPlannerInput): Promise<AssistantPlan> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await this.config.fetchImpl(`${stripTrailingSlash(this.config.baseUrl)}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'X-Application-Name': this.config.appName,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.2,
          // JSON output keeps tool execution deterministic and auditable.
          response_format: { type: 'json_object' },
          messages: buildMessages(input),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await safeResponseText(response);
        return fallbackFromOpenAiFailure(input.latestUserMessage, `openai_http_${response.status}:${detail}`);
      }

      const payload = (await response.json()) as ChatCompletionsResponse;
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        return fallbackFromOpenAiFailure(input.latestUserMessage, 'openai_empty_content');
      }

      const parsed = parseModelContent(content);
      if (!parsed) {
        return fallbackFromOpenAiFailure(input.latestUserMessage, 'openai_invalid_json');
      }

      const tool = normalizeToolName(parsed.tool, input.latestUserMessage);
      const assistantReply = normalizeAssistantReply(parsed.assistant_reply, tool, input.latestUserMessage);

      return {
        tool,
        toolInput: toRecord(parsed.tool_input),
        assistantReply,
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'openai_planner',
        source: 'openai',
        model: this.config.model,
      };
    } catch (error) {
      return fallbackFromOpenAiFailure(input.latestUserMessage, errorMessage(error));
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildMessages(input: AssistantPlannerInput): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const history = input.conversationHistory.slice(-12).map((turn) => ({
    role: turn.role,
    content: truncate(turn.content, 1200),
  }));

  const historyEndsWithLatestUserMessage =
    history.length > 0 &&
    history[history.length - 1].role === 'user' &&
    history[history.length - 1].content.trim() === input.latestUserMessage.trim();

  const messages = [{ role: 'system' as const, content: ASSISTANT_SYSTEM_PROMPT }, ...history];
  if (!historyEndsWithLatestUserMessage) {
    messages.push({ role: 'user', content: truncate(input.latestUserMessage, 1200) });
  }

  return messages;
}

function fallbackFromOpenAiFailure(message: string, reason: string): AssistantPlan {
  // Fallback preserves availability when model calls fail or return bad payloads.
  const tool = chooseTool(message);
  return buildRulePlan(tool, message, reason);
}

function buildRulePlan(tool: ToolName, message: string, reason: string): AssistantPlan {
  return {
    tool,
    toolInput: {
      raw_message: truncate(message, 300),
    },
    assistantReply: fallbackAssistantReply(tool),
    reasoning: reason,
    source: 'rules',
  };
}

function normalizeToolName(value: unknown, originalMessage: string): ToolName {
  if (typeof value !== 'string') {
    return chooseTool(originalMessage);
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'check_availability') return 'check_availability';
  if (normalized === 'book_appointment') return 'book_appointment';
  if (normalized === 'create_ticket') return 'create_ticket';
  if (normalized === 'handoff_to_human') return 'handoff_to_human';

  return chooseTool(originalMessage);
}

function parseModelContent(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeAssistantReply(reply: unknown, tool: ToolName, message: string): string {
  if (typeof reply === 'string' && reply.trim().length > 0) {
    return truncate(reply.trim(), 1000);
  }

  return buildRulePlan(tool, message, 'fallback_reply').assistantReply;
}

function safeResponseText(response: Response): Promise<string> {
  return response.text().then((text) => truncate(text.replace(/\s+/g, ' ').trim(), 200));
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'unknown_error';
}

function fallbackAssistantReply(tool: ToolName): string {
  switch (tool) {
    case 'book_appointment':
      return 'I can help schedule this for you. I am now checking booking details.';
    case 'create_ticket':
      return 'I can capture this as a support case. I am creating a ticket now.';
    case 'handoff_to_human':
      return 'I am escalating this to a human teammate so you can get direct help.';
    default:
      return 'I can help with that. I am checking current availability now.';
  }
}

const ASSISTANT_SYSTEM_PROMPT = `You are the AI routing assistant for Geekatplay Studio chat management.

Your job:
1) Pick exactly one tool.
2) Provide a short customer-facing assistant reply.
3) Return only valid JSON with this exact shape:
{
  "tool": "check_availability|book_appointment|create_ticket|handoff_to_human",
  "tool_input": { "key": "value" },
  "assistant_reply": "short response to user",
  "reasoning": "short internal rationale"
}

Routing guidelines:
- Use "book_appointment" for booking, scheduling, rescheduling.
- Use "check_availability" for availability/opening-hours questions.
- Use "create_ticket" for bugs/issues/complaints needing follow-up.
- Use "handoff_to_human" for legal/financial/medical risk, explicit human request, or unresolved escalation.
- Keep assistant_reply concise and professional.
- Never include markdown, code fences, or any text outside the JSON object.`;
