type SimulationRunStatus = 'running' | 'completed' | 'completed_with_critical_issues' | 'failed';

interface SimulationScenario {
  id: string;
  name: string;
}

interface SimulationRun {
  id: string;
  scenarioName: string;
  status: SimulationRunStatus;
  summary: {
    totalTurns: number;
    completedTurns: number;
    criticalIssueCount: number;
    failedToolCalls: number;
    handoffCount: number;
  };
  criticalIssues: string[];
}

async function main(): Promise<void> {
  const baseUrl = readArg('--base-url') ?? process.env.BASE_URL ?? 'http://localhost:3401';
  const scenarioIdArg = readArg('--scenario') ?? process.argv[2];
  const timeoutSeconds = Number(readArg('--timeout-seconds') ?? '90');
  const timeoutMs = Number.isFinite(timeoutSeconds) ? Math.max(10, timeoutSeconds) * 1000 : 90_000;

  const config = await fetchJson<{ enabled: boolean }>(`${baseUrl}/v1/simulations/config`);
  if (!config.enabled) {
    console.error('Simulation mode is disabled. Set ENABLE_SIMULATION_MODE=true and restart API/worker.');
    process.exit(1);
  }

  const scenariosResponse = await fetchJson<{ scenarios: SimulationScenario[] }>(`${baseUrl}/v1/simulations/scenarios`);
  const scenarios = scenariosResponse.scenarios;
  if (scenarios.length === 0) {
    throw new Error('No simulation scenarios were returned by the API.');
  }

  const scenarioId = scenarioIdArg ?? scenarios[0].id;
  const scenario = scenarios.find((item) => item.id === scenarioId);
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  console.log(`Starting simulation: ${scenario.name} (${scenario.id})`);
  const startResponse = await fetch(`${baseUrl}/v1/simulations/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_id: scenario.id }),
  });

  const startBody = (await startResponse.json()) as { run?: SimulationRun; error?: string; message?: string };
  if (!startResponse.ok || !startBody.run) {
    throw new Error(startBody.message ?? startBody.error ?? `Failed to start simulation (${startResponse.status})`);
  }

  console.log(`Run started: ${startBody.run.id}`);
  const completed = await waitForCompletion(baseUrl, startBody.run.id, timeoutMs);

  console.log(`Final status: ${completed.status}`);
  console.log(
    `Turns: ${completed.summary.completedTurns}/${completed.summary.totalTurns}, critical: ${completed.summary.criticalIssueCount}, failed tools: ${completed.summary.failedToolCalls}, handoffs: ${completed.summary.handoffCount}`,
  );

  if (completed.criticalIssues.length > 0) {
    console.log('Critical issues:');
    for (const issue of completed.criticalIssues) {
      console.log(`- ${issue}`);
    }
  }

  if (completed.status === 'completed') {
    process.exit(0);
  }

  process.exit(2);
}

async function waitForCompletion(baseUrl: string, runId: string, timeoutMs: number): Promise<SimulationRun> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const runResponse = await fetchJson<{ run: SimulationRun }>(`${baseUrl}/v1/simulations/runs/${runId}`);
    if (runResponse.run.status !== 'running') {
      return runResponse.run;
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for simulation run ${runId}`);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!response.ok) {
    const details =
      (body as unknown as { message?: string; error?: string }).message ??
      (body as unknown as { message?: string; error?: string }).error ??
      `HTTP ${response.status}`;
    throw new Error(`${url} -> ${details}`);
  }
  return body;
}

function readArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  const nextValue = process.argv[index + 1];
  if (!nextValue || nextValue.startsWith('--')) {
    return null;
  }

  return nextValue;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exit(1);
});
