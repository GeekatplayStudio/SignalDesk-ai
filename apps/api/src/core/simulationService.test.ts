import { describe, expect, it, vi } from 'vitest';
import { SimulationService } from './simulationService';

describe('simulation service', () => {
  it('rejects run start when simulation mode is disabled', () => {
    const service = new SimulationService(
      {
        respond: vi.fn(),
      },
      { enabled: false },
    );

    expect(() => service.startRun('booking_happy_path')).toThrow('simulation_mode_disabled');
  });

  it('can be enabled at runtime and then start runs', () => {
    const service = new SimulationService(
      {
        respond: vi.fn(),
      },
      { enabled: false },
    );

    const config = service.setEnabled(true);
    expect(config.enabled).toBe(true);
    expect(service.getConfig().enabled).toBe(true);
  });

  it('runs a scenario and completes without critical issues when outputs match expectations', async () => {
    let runCounter = 0;
    const respond = vi.fn(async (payload: { message: string; tenant_id?: string }) => {
      runCounter += 1;
      return {
        run: {
          id: `run-${runCounter}`,
          latencyMs: 50,
          toolCalls: [
            {
              tool: selectToolForMessage(payload.message),
              status: 'succeeded',
              request: { planner: 'python' },
            },
          ],
        },
        messages: [
          { role: 'user', content: payload.message },
          { role: 'assistant', content: 'Simulation reply' },
        ],
      };
    });
    const service = new SimulationService(
      {
        respond,
      },
      {
        enabled: true,
        requireModelPlanner: true,
      },
    );

    const run = service.startRun('booking_happy_path');
    const completed = await waitForCompletion(service, run.id);

    expect(completed.status).toBe('completed');
    expect(completed.summary.totalTurns).toBe(2);
    expect(completed.summary.criticalIssueCount).toBe(0);
    expect(completed.summary.plannerMix.python).toBeGreaterThan(0);
    expect(respond.mock.calls[0][0].tenant_id).toBeUndefined();
  });

  it('flags critical issues when tool selection is wrong and planner falls back to rules', async () => {
    const service = new SimulationService(
      {
        respond: vi.fn(async (payload) => ({
          run: {
            id: `run-${payload.message.length}`,
            latencyMs: 45,
            toolCalls: [
              {
                tool: 'check_availability',
                status: 'succeeded',
                request: { planner: 'rules' },
              },
            ],
          },
          messages: [
            { role: 'user', content: payload.message },
            { role: 'assistant', content: 'Fallback path' },
          ],
        })),
      },
      {
        enabled: true,
        requireModelPlanner: true,
      },
    );

    const run = service.startRun('safety_handoff');
    const completed = await waitForCompletion(service, run.id);

    expect(completed.status).toBe('completed_with_critical_issues');
    expect(completed.summary.criticalIssueCount).toBeGreaterThan(0);
    expect(completed.criticalIssues.some((issue) => issue.includes('planner_fallback_to_rules'))).toBe(true);
    expect(completed.criticalIssues.some((issue) => issue.includes('tool_mismatch'))).toBe(true);
  });

  it('ships critical-risk scenarios for intrusion, abuse, and overflow attempts', () => {
    const service = new SimulationService(
      {
        respond: vi.fn(),
      },
      { enabled: true },
    );

    const scenarios = service.listScenarios();
    const ids = scenarios.map((scenario) => scenario.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        'security_intrusion_attempt',
        'abusive_language_escalation',
        'prompt_injection_overflow',
      ]),
    );

    for (const scenarioId of ['security_intrusion_attempt', 'abusive_language_escalation', 'prompt_injection_overflow']) {
      const scenario = scenarios.find((candidate) => candidate.id === scenarioId);
      expect(scenario).toBeDefined();
      expect(scenario?.turns.length).toBeGreaterThan(0);
      for (const turn of scenario?.turns ?? []) {
        expect(turn.expectedTool).toBe('handoff_to_human');
      }
    }
  });
});

async function waitForCompletion(
  service: SimulationService,
  runId: string,
): Promise<NonNullable<ReturnType<SimulationService['getRunById']>>> {
  const timeoutMs = Date.now() + 5000;

  while (Date.now() < timeoutMs) {
    const run = service.getRunById(runId);
    if (!run) {
      throw new Error(`run_not_found:${runId}`);
    }

    if (run.status !== 'running') {
      return run;
    }

    await sleep(10);
  }

  throw new Error(`simulation_timeout:${runId}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function selectToolForMessage(message: string): 'book_appointment' | 'create_ticket' | 'handoff_to_human' {
  const text = message.toLowerCase();
  if (text.includes('issue') || text.includes('invoice') || text.includes('ticket')) {
    return 'create_ticket';
  }
  if (text.includes('human') || text.includes('legal') || text.includes('agent')) {
    return 'handoff_to_human';
  }
  return 'book_appointment';
}
