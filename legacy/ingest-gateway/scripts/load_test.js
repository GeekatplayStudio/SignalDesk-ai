import http from 'k6/http';
import { check, fail } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3005';
const REPLAY_PROVIDER_ID = __ENV.REPLAY_PROVIDER_ID || 'SM-REPLAY-FIXED-001';

const goodSuccessRate = new Rate('good_success_rate');
const replay201 = new Counter('replay_status_201');
const replay200 = new Counter('replay_status_200');
const noisy429 = new Counter('noisy_status_429');

export const options = {
  scenarios: {
    good_citizen: {
      executor: 'constant-vus',
      exec: 'goodCitizen',
      vus: 50,
      duration: '20s',
      startTime: '0s',
    },
    replay_attack: {
      executor: 'per-vu-iterations',
      exec: 'replayAttack',
      vus: 10,
      iterations: 1,
      maxDuration: '10s',
      startTime: '22s',
    },
    noisy_neighbor: {
      executor: 'constant-arrival-rate',
      exec: 'noisyNeighbor',
      rate: 200,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 100,
      maxVUs: 400,
      startTime: '35s',
    },
  },
  thresholds: {
    good_success_rate: ['rate==1.0'],
    replay_status_201: ['count==1'],
    replay_status_200: ['count==9'],
    noisy_status_429: ['count>0'],
  },
};

export function goodCitizen() {
  const payload = JSON.stringify({
    tenant_id: `tenant-good-${__VU % 10}`,
    From: '+14155550001',
    To: '+14155550002',
    Body: `good-citizen-${__VU}-${__ITER}`,
    MessageSid: `SM-GOOD-${__VU}-${__ITER}-${Date.now()}`,
    Timestamp: new Date().toISOString(),
  });

  const response = http.post(`${BASE_URL}/v1/ingest/sms`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { scenario: 'good_citizen' },
  });

  const ok = check(response, {
    'good citizen accepted or deduped': (r) => r.status === 200 || r.status === 201,
  });

  goodSuccessRate.add(ok);
}

export function replayAttack() {
  const payload = JSON.stringify({
    tenant_id: 'tenant-replay',
    From: '+14155551111',
    To: '+14155552222',
    Body: 'replay-attack',
    MessageSid: REPLAY_PROVIDER_ID,
    Timestamp: '2026-02-09T00:00:00.000Z',
  });

  const response = http.post(`${BASE_URL}/v1/ingest/sms`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { scenario: 'replay_attack' },
  });

  check(response, {
    'replay request deduped or accepted': (r) => r.status === 200 || r.status === 201,
  });

  if (response.status === 201) {
    replay201.add(1);
  } else if (response.status === 200) {
    replay200.add(1);
  }
}

export function noisyNeighbor() {
  const payload = JSON.stringify({
    tenant_id: 'tenant-noisy',
    userId: `user-${__VU}`,
    message: `noisy-neighbor-${__ITER}`,
    chatId: 'chat-noisy',
    timestamp: new Date().toISOString(),
    messageId: `CHAT-NOISY-${__VU}-${__ITER}-${Date.now()}`,
  });

  const response = http.post(`${BASE_URL}/v1/ingest/chat`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { scenario: 'noisy_neighbor' },
  });

  if (response.status === 429) {
    noisy429.add(1);
  }

  check(response, {
    'noisy neighbor returns expected status': (r) => r.status === 201 || r.status === 429,
  });
}

export function teardown() {
  const response = http.get(
    `${BASE_URL}/v1/internal/events/count?provider_message_id=${encodeURIComponent(REPLAY_PROVIDER_ID)}`,
  );

  const ok = check(response, {
    'internal count endpoint available': (r) => r.status === 200,
  });

  if (!ok) {
    fail('Replay dedupe verification failed: internal count endpoint is not available.');
  }

  const body = response.json();
  const count = Number(body?.count ?? -1);

  if (count !== 1) {
    fail(`Replay dedupe verification failed: expected 1 DB row for ${REPLAY_PROVIDER_ID}, got ${count}`);
  }
}
