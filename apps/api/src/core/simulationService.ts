import crypto from 'crypto';
import type { AgentRespondInput } from './agentSchemas';
import type { ToolName } from './tooling';

export type SimulationRunStatus = 'running' | 'completed' | 'completed_with_critical_issues' | 'failed';
export type SimulationStepStatus = 'completed' | 'critical' | 'failed';
export type SimulationPlannerSource = 'python' | 'openai' | 'rules' | 'unknown';

export interface SimulationScenarioTurn {
  id: string;
  userMessage: string;
  expectedTool: ToolName;
  maxLatencyMs?: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  lifeExample: string;
  criticalChecks: string[];
  turns: SimulationScenarioTurn[];
}

export interface SimulationStepResult {
  turnId: string;
  userMessage: string;
  assistantReply: string | null;
  expectedTool: ToolName;
  selectedTool: string | null;
  plannerSource: SimulationPlannerSource;
  toolCallStatus: string | null;
  runId: string | null;
  latencyMs: number | null;
  status: SimulationStepStatus;
  criticalIssues: string[];
}

export interface SimulationRunSummary {
  totalTurns: number;
  completedTurns: number;
  criticalIssueCount: number;
  failedToolCalls: number;
  handoffCount: number;
  plannerMix: {
    python: number;
    openai: number;
    rules: number;
    unknown: number;
  };
}

export interface SimulationRun {
  id: string;
  scenarioId: string;
  scenarioName: string;
  scenarioDescription: string;
  lifeExample: string;
  status: SimulationRunStatus;
  startedAt: string;
  endedAt: string | null;
  conversationId: string;
  steps: SimulationStepResult[];
  criticalIssues: string[];
  summary: SimulationRunSummary;
}

export interface SimulationConfigView {
  enabled: boolean;
  activeRunId: string | null;
  activeScenarioId: string | null;
  activeScenarioName: string | null;
}

export interface SimulationServiceOptions {
  enabled: boolean;
  requireModelPlanner?: boolean;
  maxRuns?: number;
  nowMs?: () => number;
  onRunFinished?: (run: SimulationRun) => void;
}

interface SimulationAgentService {
  respond(payload: AgentRespondInput): Promise<{
    run: {
      id: string;
      latencyMs?: number | null;
      toolCalls: Array<{
        tool?: string;
        status?: string;
        request?: unknown;
      }>;
    };
    messages: Array<{
      role?: string;
      content?: string;
    }>;
  }>;
}

export class SimulationService {
  private readonly runs: SimulationRun[] = [];
  private readonly maxRuns: number;
  private readonly nowMs: () => number;
  private enabled: boolean;
  private activeRunId: string | null = null;
  private activeScenarioId: string | null = null;
  private activeScenarioName: string | null = null;

  constructor(
    private readonly agentService: SimulationAgentService,
    private readonly options: SimulationServiceOptions,
  ) {
    this.maxRuns = Math.max(1, options.maxRuns ?? 40);
    this.nowMs = options.nowMs ?? (() => Date.now());
    this.enabled = options.enabled;
  }

  getConfig(): SimulationConfigView {
    return {
      enabled: this.enabled,
      activeRunId: this.activeRunId,
      activeScenarioId: this.activeScenarioId,
      activeScenarioName: this.activeScenarioName,
    };
  }

  setEnabled(enabled: boolean): SimulationConfigView {
    this.enabled = enabled;
    return this.getConfig();
  }

  listScenarios(): SimulationScenario[] {
    return SIMULATION_SCENARIOS;
  }

  listRuns(limit = 20): SimulationRun[] {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    return this.runs.slice(0, safeLimit);
  }

  getRunById(runId: string): SimulationRun | null {
    return this.runs.find((run) => run.id === runId) ?? null;
  }

  startRun(scenarioId: string): SimulationRun {
    if (!this.enabled) {
      throw new Error('simulation_mode_disabled');
    }

    if (this.activeRunId) {
      throw new Error('simulation_already_running');
    }

    const scenario = SIMULATION_SCENARIOS.find((candidate) => candidate.id === scenarioId);
    if (!scenario) {
      throw new Error('unknown_scenario');
    }

    const run: SimulationRun = {
      id: crypto.randomUUID(),
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      scenarioDescription: scenario.description,
      lifeExample: scenario.lifeExample,
      status: 'running',
      startedAt: this.isoNow(),
      endedAt: null,
      conversationId: `sim-${scenario.id}-${this.nowMs()}`,
      steps: [],
      criticalIssues: [],
      summary: emptySummary(scenario.turns.length),
    };

    this.activeRunId = run.id;
    this.activeScenarioId = scenario.id;
    this.activeScenarioName = scenario.name;
    this.runs.unshift(run);
    this.trimRuns();

    void this.executeRun(run, scenario);
    return run;
  }

  private async executeRun(run: SimulationRun, scenario: SimulationScenario): Promise<void> {
    try {
      for (const turn of scenario.turns) {
        const step = await this.executeTurn(run.conversationId, turn);
        run.steps.push(step);
      }

      run.criticalIssues = aggregateCriticalIssues(run.steps);
      run.summary = summarizeSteps(run.steps, scenario.turns.length);
      run.status = run.criticalIssues.length > 0 ? 'completed_with_critical_issues' : 'completed';
    } catch (error) {
      run.status = 'failed';
      run.criticalIssues.push(`run_failure: ${errorMessage(error)}`);
      run.summary = summarizeSteps(run.steps, scenario.turns.length);
    } finally {
      run.endedAt = this.isoNow();
      this.activeRunId = null;
      this.activeScenarioId = null;
      this.activeScenarioName = null;
      this.options.onRunFinished?.(run);
    }
  }

  private async executeTurn(
    conversationId: string,
    turn: SimulationScenarioTurn,
  ): Promise<SimulationStepResult> {
    const startedAtMs = this.nowMs();

    try {
      const result = await this.agentService.respond({
        conversation_id: conversationId,
        message: turn.userMessage,
      });

      const toolCall = result.run.toolCalls[0];
      const selectedTool = typeof toolCall?.tool === 'string' ? toolCall.tool : null;
      const toolCallStatus = typeof toolCall?.status === 'string' ? toolCall.status : null;
      const plannerSource = normalizePlannerSource(toRecord(toolCall?.request).planner);
      const assistantReply = findAssistantReply(result.messages);
      const latencyMs =
        typeof result.run.latencyMs === 'number' ? result.run.latencyMs : this.nowMs() - startedAtMs;

      const criticalIssues: string[] = [];
      if (!toolCall) {
        criticalIssues.push('missing_tool_call');
      }
      if (toolCallStatus && toolCallStatus !== 'succeeded') {
        criticalIssues.push(`tool_call_failed:${toolCallStatus}`);
      }
      if (selectedTool !== turn.expectedTool) {
        criticalIssues.push(`tool_mismatch:expected=${turn.expectedTool},actual=${selectedTool ?? 'none'}`);
      }
      if (typeof turn.maxLatencyMs === 'number' && latencyMs > turn.maxLatencyMs) {
        criticalIssues.push(`latency_budget_exceeded:${latencyMs}ms>${turn.maxLatencyMs}ms`);
      }
      if (!assistantReply || assistantReply.trim().length === 0) {
        criticalIssues.push('missing_assistant_reply');
      }
      if (this.options.requireModelPlanner && plannerSource === 'rules') {
        criticalIssues.push('planner_fallback_to_rules');
      }

      return {
        turnId: turn.id,
        userMessage: turn.userMessage,
        assistantReply,
        expectedTool: turn.expectedTool,
        selectedTool,
        plannerSource,
        toolCallStatus,
        runId: result.run.id ?? null,
        latencyMs,
        status: criticalIssues.length > 0 ? 'critical' : 'completed',
        criticalIssues,
      };
    } catch (error) {
      return {
        turnId: turn.id,
        userMessage: turn.userMessage,
        assistantReply: null,
        expectedTool: turn.expectedTool,
        selectedTool: null,
        plannerSource: 'unknown',
        toolCallStatus: null,
        runId: null,
        latencyMs: null,
        status: 'failed',
        criticalIssues: [`turn_execution_failed:${errorMessage(error)}`],
      };
    }
  }

  private trimRuns(): void {
    if (this.runs.length > this.maxRuns) {
      this.runs.length = this.maxRuns;
    }
  }

  private isoNow(): string {
    return new Date(this.nowMs()).toISOString();
  }
}

function aggregateCriticalIssues(steps: SimulationStepResult[]): string[] {
  const issues: string[] = [];

  for (const step of steps) {
    for (const issue of step.criticalIssues) {
      issues.push(`${step.turnId}:${issue}`);
    }
  }

  return issues;
}

function summarizeSteps(steps: SimulationStepResult[], totalTurns: number): SimulationRunSummary {
  const summary = emptySummary(totalTurns);
  summary.completedTurns = steps.length;

  for (const step of steps) {
    summary.criticalIssueCount += step.criticalIssues.length;

    if (step.toolCallStatus === 'failed') {
      summary.failedToolCalls += 1;
    }

    if (step.selectedTool === 'handoff_to_human') {
      summary.handoffCount += 1;
    }

    if (step.plannerSource === 'python') summary.plannerMix.python += 1;
    else if (step.plannerSource === 'openai') summary.plannerMix.openai += 1;
    else if (step.plannerSource === 'rules') summary.plannerMix.rules += 1;
    else summary.plannerMix.unknown += 1;
  }

  return summary;
}

function emptySummary(totalTurns: number): SimulationRunSummary {
  return {
    totalTurns,
    completedTurns: 0,
    criticalIssueCount: 0,
    failedToolCalls: 0,
    handoffCount: 0,
    plannerMix: {
      python: 0,
      openai: 0,
      rules: 0,
      unknown: 0,
    },
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizePlannerSource(value: unknown): SimulationPlannerSource {
  if (value === 'python') return 'python';
  if (value === 'openai') return 'openai';
  if (value === 'rules') return 'rules';
  return 'unknown';
}

function findAssistantReply(messages: Array<{ role?: string; content?: string }>): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'assistant' && typeof message.content === 'string') {
      return message.content;
    }
  }

  return null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }
  return 'unknown_error';
}

const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'booking_happy_path',
    name: 'Booking Flow Happy Path',
    description: 'Validate that booking requests are routed, executed, and answered end-to-end.',
    lifeExample: 'A customer asks a salon to reserve an appointment for next week.',
    criticalChecks: [
      'Booking requests must route to book_appointment.',
      'No failed tool calls are allowed.',
      'Assistant reply must always be present.',
    ],
    turns: [
      {
        id: 'booking-request',
        userMessage: 'Hi, can you book me an appointment for next Tuesday at 2pm?',
        expectedTool: 'book_appointment',
        maxLatencyMs: 6000,
      },
      {
        id: 'booking-confirmation',
        userMessage: 'Great, please book it now and send the confirmation.',
        expectedTool: 'book_appointment',
        maxLatencyMs: 6000,
      },
    ],
  },
  {
    id: 'billing_issue_ticket',
    name: 'Billing Issue Escalation',
    description: 'Validate support-ticket creation for complaint and billing issue intents.',
    lifeExample: 'A customer reports an incorrect charge and asks support to investigate.',
    criticalChecks: [
      'Issue reports must route to create_ticket.',
      'No silent failures on tool execution.',
      'Assistant response should acknowledge ticket creation.',
    ],
    turns: [
      {
        id: 'issue-report',
        userMessage: 'I have an issue with my last invoice and need help.',
        expectedTool: 'create_ticket',
        maxLatencyMs: 6000,
      },
      {
        id: 'issue-followup',
        userMessage: 'Please create a support ticket for this billing issue.',
        expectedTool: 'create_ticket',
        maxLatencyMs: 6000,
      },
    ],
  },
  {
    id: 'safety_handoff',
    name: 'Safety Human Handoff',
    description: 'Validate that legal-risk requests escalate directly to a human agent.',
    lifeExample: 'A user asks for legal advice and explicitly requests a real person.',
    criticalChecks: [
      'High-risk/legal intents must route to handoff_to_human.',
      'Handoff cannot be replaced by automation tools.',
      'Critical issues are raised if fallback routing is used.',
    ],
    turns: [
      {
        id: 'legal-risk',
        userMessage: 'I need legal advice for a lawsuit, connect me to a human agent.',
        expectedTool: 'handoff_to_human',
        maxLatencyMs: 6000,
      },
      {
        id: 'explicit-human-request',
        userMessage: 'Please transfer me to a real support agent now.',
        expectedTool: 'handoff_to_human',
        maxLatencyMs: 6000,
      },
    ],
  },
];
