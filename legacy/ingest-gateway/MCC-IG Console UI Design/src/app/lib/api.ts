export type ChannelPath = 'sms' | 'chat' | 'voice';

export interface ApiCallResult<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  path: string;
}

export interface DlqEntry {
  failed_at?: string;
  retries?: number;
  error?: string;
  event?: {
    provider_message_id?: string;
    tenant_id?: string;
    channel_type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function baseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL;
  return typeof value === 'string' && value.length > 0 ? value : '';
}

function buildUrl(path: string): string {
  const base = baseUrl();
  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
}

export async function postIngest<TPayload extends Record<string, unknown>>(
  channel: ChannelPath,
  payload: TPayload,
): Promise<ApiCallResult> {
  const path = `/v1/ingest/${channel}`;
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await safeJson(response);
  return {
    status: response.status,
    statusText: response.statusText,
    data,
    path,
  };
}

export async function getHealth(): Promise<ApiCallResult<{ status?: string }>> {
  const path = '/health';
  const response = await fetch(buildUrl(path));
  const data = await safeJson(response);
  return {
    status: response.status,
    statusText: response.statusText,
    data,
    path,
  };
}

export async function getProviderCount(providerMessageId: string): Promise<ApiCallResult<{ count?: number }>> {
  const encoded = encodeURIComponent(providerMessageId);
  const path = `/v1/internal/events/count?provider_message_id=${encoded}`;
  const response = await fetch(buildUrl(path));
  const data = await safeJson(response);
  return {
    status: response.status,
    statusText: response.statusText,
    data,
    path,
  };
}

export async function getDlqEntries(limit = 50): Promise<ApiCallResult<{ entries?: DlqEntry[] }>> {
  const sanitizedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(500, Math.floor(limit))) : 50;
  const path = `/v1/internal/dlq?limit=${sanitizedLimit}`;
  const response = await fetch(buildUrl(path));
  const data = await safeJson(response);

  return {
    status: response.status,
    statusText: response.statusText,
    data,
    path,
  };
}

export function toIsoTimestamp(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (_error) {
    return {};
  }
}
