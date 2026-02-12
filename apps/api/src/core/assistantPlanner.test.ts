import { describe, expect, it, vi } from 'vitest';
import { createAssistantPlanner } from './assistantPlanner';

const baseConfig = {
  pythonPlannerUrl: undefined,
  pythonPlannerTimeoutMs: 1500,
  pythonPlannerFailureCooldownMs: 500,
  openAiModel: 'gpt-4.1-mini',
  openAiBaseUrl: 'https://api.openai.com/v1',
  openAiTimeoutMs: 1500,
  appName: 'Geekatplay Studio',
};

describe('assistant planner', () => {
  it('uses rule fallback when no planner integration is configured', async () => {
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

  it('uses OpenAI JSON output when Python planner is disabled', async () => {
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

  it('uses Python planner first when configured', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          tool: 'book_appointment',
          tool_input: { timezone: 'America/New_York' },
          assistant_reply: 'I can book that now.',
          reasoning: 'python_fast_path',
          model: 'gpt-4.1-mini',
        }),
        { status: 200 },
      ),
    );

    const planner = createAssistantPlanner({
      ...baseConfig,
      pythonPlannerUrl: 'http://ai-planner:8080',
      openAiApiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const plan = await planner.plan({
      latestUserMessage: 'Book me for next Tuesday.',
      conversationHistory: [],
    });

    expect(plan.source).toBe('python');
    expect(plan.tool).toBe('book_appointment');
    expect(plan.toolInput).toEqual({ timezone: 'America/New_York' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls back to OpenAI when Python planner is unavailable', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/v1/plan')) {
        return new Response('planner_down', { status: 503 });
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tool: 'check_availability',
                  tool_input: { region: 'nyc' },
                  assistant_reply: 'I am checking openings.',
                  reasoning: 'openai_fallback',
                }),
              },
            },
          ],
        }),
        { status: 200 },
      );
    });

    const planner = createAssistantPlanner({
      ...baseConfig,
      pythonPlannerUrl: 'http://ai-planner:8080',
      openAiApiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const plan = await planner.plan({
      latestUserMessage: 'Do you have anything open tomorrow?',
      conversationHistory: [],
    });

    expect(plan.source).toBe('openai');
    expect(plan.tool).toBe('check_availability');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('skips Python planner calls during cooldown after failure', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/v1/plan')) {
        return new Response('planner_down', { status: 503 });
      }

      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tool: 'check_availability',
                  tool_input: {},
                  assistant_reply: 'Checking openings.',
                  reasoning: 'openai_fallback',
                }),
              },
            },
          ],
        }),
        { status: 200 },
      );
    });

    const planner = createAssistantPlanner({
      ...baseConfig,
      pythonPlannerUrl: 'http://ai-planner:8080',
      pythonPlannerFailureCooldownMs: 10_000,
      openAiApiKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await planner.plan({
      latestUserMessage: 'Do you have availability tomorrow morning?',
      conversationHistory: [],
    });
    await planner.plan({
      latestUserMessage: 'Any open slots in the afternoon?',
      conversationHistory: [],
    });

    // First request: python + openai fallback. Second request: openai only due cooldown.
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
