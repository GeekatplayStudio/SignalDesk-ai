export {};

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3005';
const totalRequests = Number(process.env.TOTAL_REQUESTS ?? 1000);
const concurrency = Number(process.env.CONCURRENCY ?? 100);
const duplicateFactor = Number(process.env.DUPLICATE_FACTOR ?? 5);

interface Counter {
  [status: string]: number;
}

async function postSms(index: number): Promise<number> {
  const dedupeGroup = Math.floor(index / duplicateFactor);
  const tenant = `tenant-${index % 5}`;

  const response = await fetch(`${baseUrl}/v1/ingest/sms`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id: tenant,
      From: '+14155550001',
      To: '+14155550002',
      Body: `load-test-message-${index}`,
      MessageSid: `SM-LOAD-${dedupeGroup}`,
      Timestamp: new Date().toISOString(),
    }),
  });

  return response.status;
}

async function run(): Promise<void> {
  const counters: Counter = {};
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= totalRequests) {
        return;
      }

      try {
        const status = await postSms(current);
        counters[status] = (counters[status] ?? 0) + 1;
      } catch (_error) {
        counters.network_error = (counters.network_error ?? 0) + 1;
      }
    }
  }

  const start = Date.now();
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const durationMs = Date.now() - start;

  // eslint-disable-next-line no-console
  console.log('Load test completed');
  // eslint-disable-next-line no-console
  console.log({ totalRequests, concurrency, duplicateFactor, durationMs, counters });
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Load test failed', error);
  process.exit(1);
});
