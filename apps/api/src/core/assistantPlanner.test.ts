import { describe, expect, it, vi } from 'vitest';
import { createAssistantPlanner } from './assistantPlanner';

const baseConfig = {
  openAiModel: 'gpt-4.1-mini',
  openAiBaseUrl: 'https://api.openai.com/v1',
  openAiTimeoutMs: 1500,
  appName: 'Geekatplay Studio',
};

describe('assistant planner', () => {
  it('uses rule fallback when OPENAI_API_KEY is missing', async () => {
    const planner = createAssistantPlanner({
      ...baseConfig,
      openAiApiKey: undefined,
    });

    const plan = await planner.plan({
      latestUserMessage: 'Can you book me for tomorrow afternoon?',
      conversationHistory: [],
    });

    expect(plan.source).toBe('rules');
    expect(plan.tool).toBe('book_appointment');
    expect(plan.assistantReply.length).toBeGreaterThan(10);
  });

  it('uses OpenAI JSON output when available', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tool: 'create_ticket',
                  tool_input: { priority: 'high' },
                  assistant_reply: 'I logged this for the support team.',
                  reasoning: 'user_reported_issue',
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const planner = createAssistantPlanner({
      ...baseConfig,
      openAiApiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const plan = await planner.plan({
      latestUserMessage: 'I have an issue with billing.',
      conversationHistory: [],
    });

    expect(plan.source).toBe('openai');
    expect(plan.tool).toBe('create_ticket');
    expect(plan.toolInput).toEqual({ priority: 'high' });
    expect(plan.assistantReply).toContain('support team');
  });

  it('falls back to rules when OpenAI response is malformed', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'not-json' } }],
        }),
        { status: 200 },
      ),
    );

    const planner = createAssistantPlanner({
      ...baseConfig,
      openAiApiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const plan = await planner.plan({
      latestUserMessage: 'I need a human agent please.',
      conversationHistory: [],
    });

    expect(plan.source).toBe('rules');
    expect(plan.tool).toBe('handoff_to_human');
  });
});
