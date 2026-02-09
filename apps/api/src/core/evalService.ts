import fs from 'fs';
import path from 'path';
import { load as loadYaml } from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';

export interface EvalCase {
  id: string;
  category: string;
  description: string;
  turns: Array<{ user: string; expected_tool?: string; expected_guardrail?: string; allow_refusal?: boolean }>;
}

export interface EvalRunResult {
  id: string;
  status: 'passed' | 'failed';
  passRate: number;
  cases: Array<{ id: string; status: 'passed' | 'failed'; detail?: string }>;
  createdAt: string;
}

export function loadGoldens(baseDir: string): EvalCase[] {
  const files = fs.readdirSync(baseDir).filter((f) => f.endsWith('.yaml'));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(baseDir, file), 'utf8');
    const parsed = loadYaml(raw) as EvalCase;
    return parsed;
  });
}

function detectGuardrail(user: string): string | null {
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(user)) return 'PII_EMAIL';
  if (user.toLowerCase().includes('ignore instructions')) return 'POLICY_IGNORE_INSTRUCTIONS';
  return null;
}

function chooseTool(user: string): string {
  const text = user.toLowerCase();
  if (text.includes('book') || text.includes('flight') || text.includes('schedule')) return 'book_appointment';
  if (text.includes('ticket') || text.includes('issue')) return 'create_ticket';
  return 'check_availability';
}

export function runEvalSuite(baseDir: string): EvalRunResult {
  const cases = loadGoldens(baseDir);
  const results: EvalRunResult['cases'] = [];

  for (const test of cases) {
    const turn = test.turns[0];
    const guardrail = detectGuardrail(turn.user);
    const tool = chooseTool(turn.user);

    const guardrailOk = turn.expected_guardrail ? guardrail === turn.expected_guardrail : true;
    const toolOk = turn.expected_tool ? tool === turn.expected_tool : true;

    const passed = guardrailOk && toolOk;
    results.push({
      id: test.id,
      status: passed ? 'passed' : 'failed',
      detail: passed
        ? undefined
        : `expected ${turn.expected_tool ?? turn.expected_guardrail}, got tool=${tool} guardrail=${guardrail}`,
    });
  }

  const passCount = results.filter((r) => r.status === 'passed').length;
  return {
    id: uuidv4(),
    status: passCount === results.length ? 'passed' : 'failed',
    passRate: Number((passCount / results.length).toFixed(2)),
    cases: results,
    createdAt: new Date().toISOString(),
  };
}
