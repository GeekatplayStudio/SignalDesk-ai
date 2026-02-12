export type PlannerSource = 'python' | 'openai' | 'rules' | 'unknown';

export interface ToolCallRecord {
  tool: string;
  status: string;
  request?: unknown;
  response?: unknown;
  latencyMs?: number | null;
}

export interface PlannerMeta {
  source: PlannerSource;
  model: string | null;
  reasoning: string | null;
  inputPreview: string | null;
}

export function extractPlannerMeta(toolCall?: ToolCallRecord): PlannerMeta {
  const request = toRecord(toolCall?.request);

  const source = normalizePlannerSource(request.planner);
  const model = typeof request.model === 'string' ? request.model : null;
  const reasoning = typeof request.reasoning === 'string' ? request.reasoning : null;
  const inputPreview = request.input ? toPreview(request.input) : null;

  return {
    source,
    model,
    reasoning,
    inputPreview,
  };
}

export function plannerBadgeClass(source: PlannerSource): string {
  switch (source) {
    case 'python':
      return 'bg-cyan-500/15 text-cyan-300 border border-cyan-700/50';
    case 'openai':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-700/50';
    case 'rules':
      return 'bg-amber-500/15 text-amber-300 border border-amber-700/50';
    default:
      return 'bg-slate-700/50 text-slate-300 border border-slate-600';
  }
}

function normalizePlannerSource(value: unknown): PlannerSource {
  if (value === 'python') return 'python';
  if (value === 'openai') return 'openai';
  if (value === 'rules') return 'rules';
  return 'unknown';
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toPreview(value: unknown): string {
  try {
    const serialized = JSON.stringify(value);
    if (serialized.length <= 120) {
      return serialized;
    }
    return `${serialized.slice(0, 119)}…`;
  } catch {
    return String(value);
  }
}
