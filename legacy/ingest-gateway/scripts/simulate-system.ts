export {};

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3005';
const uniqueRequests = Number(process.env.SIM_UNIQUE_REQUESTS ?? 60);
const duplicateRequests = Number(process.env.SIM_DUPLICATE_REQUESTS ?? 10);
const noisyRequests = Number(process.env.SIM_NOISY_REQUESTS ?? 250);
const failingRequests = Number(process.env.SIM_FAILING_REQUESTS ?? 5);
const concurrency = Number(process.env.SIM_CONCURRENCY ?? 50);
const postRunWaitMs = Number(process.env.SIM_POST_WAIT_MS ?? 3000);
const dlqFetchLimit = Number(process.env.SIM_DLQ_FETCH_LIMIT ?? 300);

interface HttpResult {
  status: number;
  body: unknown;
}

type StatusCounts = Record<string, number>;

async function run(): Promise<void> {
  const duplicateProviderId = `SM-SIM-DUP-${Date.now()}`;
  const failingProviderIds: string[] = [];

  await checkHealth();

  const uniqueCounts = await runStage('unique_traffic', uniqueRequests, concurrency, async (i) => {
    if (i % 3 === 0) {
      return postJson('/v1/ingest/sms', {
        tenant_id: `tenant-sim-${i % 4}`,
        From: '+14155550101',
        To: '+14155550102',
        Body: `simulation sms ${i}`,
        MessageSid: `SM-SIM-UNIQ-${i}-${Date.now()}`,
        Timestamp: new Date().toISOString(),
      });
    }

    if (i % 3 === 1) {
      return postJson('/v1/ingest/chat', {
        tenant_id: `tenant-sim-${i % 4}`,
        userId: `user-${i}`,
        message: `simulation chat ${i}`,
        chatId: `chat-${i % 7}`,
        timestamp: new Date().toISOString(),
        messageId: `CHAT-SIM-UNIQ-${i}-${Date.now()}`,
      });
    }

    return postJson('/v1/ingest/voice', {
      tenant_id: `tenant-sim-${i % 4}`,
      callId: `call-sim-${i}`,
      segmentId: `seg-${i}`,
      transcript_text: `simulation voice transcript ${i}`,
      confidence: 0.94,
      duration: 12,
      timestamp: new Date().toISOString(),
    });
  });

  const duplicateCounts = await runStage('duplicate_replay', duplicateRequests, concurrency, async () => {
    return postJson('/v1/ingest/sms', {
      tenant_id: 'tenant-sim-replay',
      From: '+14155551000',
      To: '+14155551001',
      Body: 'duplicate replay payload',
      MessageSid: duplicateProviderId,
      Timestamp: new Date().toISOString(),
    });
  });

  const noisyCounts = await runStage('noisy_neighbor', noisyRequests, concurrency, async (i) => {
    return postJson('/v1/ingest/chat', {
      tenant_id: 'tenant-sim-noisy',
      userId: `noisy-user-${i % 20}`,
      message: `noisy payload ${i}`,
      chatId: 'chat-sim-noisy',
      timestamp: new Date().toISOString(),
      messageId: `CHAT-SIM-NOISY-${i}-${Date.now()}`,
    });
  });

  const failingCounts = await runStage('forced_worker_failures', failingRequests, concurrency, async (i) => {
    const messageId = `CHAT-SIM-FAIL-${i}-${Date.now()}`;
    failingProviderIds.push(messageId);

    return postJson('/v1/ingest/chat', {
      tenant_id: 'tenant-sim-fail',
      userId: `fail-user-${i}`,
      message: `this message should fail in worker (${i})`,
      chatId: 'chat-sim-fail',
      timestamp: new Date().toISOString(),
      messageId,
      metadata: {
        simulate_failure: true,
        scenario: 'simulation_mode',
      },
    });
  });

  await sleep(postRunWaitMs);

  const duplicateVerification = await verifyDuplicateCount(duplicateProviderId);
  const dlqVerification = await verifyDlqFailures(failingProviderIds, dlqFetchLimit);

  const report = {
    config: {
      baseUrl,
      uniqueRequests,
      duplicateRequests,
      noisyRequests,
      failingRequests,
      concurrency,
      postRunWaitMs,
    },
    stages: {
      unique_traffic: uniqueCounts,
      duplicate_replay: duplicateCounts,
      noisy_neighbor: noisyCounts,
      forced_worker_failures: failingCounts,
    },
    verification: {
      duplicate_provider_id: duplicateProviderId,
      duplicate_count_in_db: duplicateVerification,
      forced_failures_expected: failingProviderIds.length,
      forced_failures_found_in_dlq: dlqVerification.matched,
      total_dlq_entries_scanned: dlqVerification.total,
    },
  };

  // eslint-disable-next-line no-console
  console.log('Simulation completed');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));

  printHints(report);
}

async function checkHealth(): Promise<void> {
  const result = await getJson('/health');

  if (result.status !== 200) {
    throw new Error(`Health check failed with status ${result.status}`);
  }

  // eslint-disable-next-line no-console
  console.log('Health check passed');
}

async function runStage(
  stageName: string,
  totalRequests: number,
  parallelism: number,
  task: (index: number) => Promise<HttpResult>,
): Promise<StatusCounts> {
  const counts: StatusCounts = {};

  await runConcurrent(totalRequests, parallelism, async (index) => {
    try {
      const result = await task(index);
      increment(counts, String(result.status));
    } catch (_error) {
      increment(counts, 'network_error');
    }
  });

  // eslint-disable-next-line no-console
  console.log(`${stageName} finished`, counts);

  return counts;
}

async function verifyDuplicateCount(providerMessageId: string): Promise<number | null> {
  const result = await getJson(
    `/v1/internal/events/count?provider_message_id=${encodeURIComponent(providerMessageId)}`,
  );

  if (result.status !== 200) {
    return null;
  }

  const body = result.body as { count?: number };
  return Number(body.count ?? 0);
}

async function verifyDlqFailures(
  providerMessageIds: string[],
  limit: number,
): Promise<{ matched: number | null; total: number | null }> {
  const result = await getJson(`/v1/internal/dlq?limit=${Math.max(1, limit)}`);
  if (result.status !== 200) {
    return { matched: null, total: null };
  }

  const body = result.body as { entries?: Array<{ event?: { provider_message_id?: string } }> };
  const entries = Array.isArray(body.entries) ? body.entries : [];
  const targets = new Set(providerMessageIds);
  const matched = entries.filter((entry) => targets.has(String(entry.event?.provider_message_id ?? ''))).length;

  return {
    matched,
    total: entries.length,
  };
}

async function postJson(path: string, payload: unknown): Promise<HttpResult> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return {
    status: response.status,
    body: await safeJson(response),
  };
}

async function getJson(path: string): Promise<HttpResult> {
  const response = await fetch(`${baseUrl}${path}`);

  return {
    status: response.status,
    body: await safeJson(response),
  };
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (_error) {
    return {};
  }
}

async function runConcurrent(
  total: number,
  parallelism: number,
  task: (index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(total, parallelism)) }, async () => {
    while (true) {
      const current = cursor;
      cursor += 1;

      if (current >= total) {
        return;
      }

      await task(current);
    }
  });

  await Promise.all(workers);
}

function increment(counts: StatusCounts, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function printHints(report: {
  verification: {
    duplicate_count_in_db: number | null;
    forced_failures_found_in_dlq: number | null;
    forced_failures_expected: number;
  };
  stages: {
    noisy_neighbor: StatusCounts;
  };
}): void {
  const hints: string[] = [];

  if (report.verification.duplicate_count_in_db !== 1) {
    hints.push(
      `Duplicate verification expected DB count=1 but got ${String(report.verification.duplicate_count_in_db)}.`,
    );
  }

  if ((report.stages.noisy_neighbor['429'] ?? 0) === 0) {
    hints.push('No 429 responses observed in noisy neighbor stage. Increase SIM_NOISY_REQUESTS or lower rate limits.');
  }

  if (report.verification.forced_failures_found_in_dlq !== null) {
    if (report.verification.forced_failures_found_in_dlq < report.verification.forced_failures_expected) {
      hints.push(
        'Forced failures were not fully observed in DLQ. Enable ENABLE_SIMULATION_MODE=true in worker and rerun.',
      );
    }
  } else {
    hints.push('DLQ verification endpoint unavailable. Enable ENABLE_INTERNAL_ENDPOINTS=true.');
  }

  if (hints.length === 0) {
    // eslint-disable-next-line no-console
    console.log('All simulation checks look good.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('Simulation hints:');
  for (const hint of hints) {
    // eslint-disable-next-line no-console
    console.log(`- ${hint}`);
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Simulation failed', error);
  process.exit(1);
});
