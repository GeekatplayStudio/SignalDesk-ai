export interface ActivityRecord {
  id: string;
  channel: 'SMS' | 'CHAT' | 'VOICE';
  providerMessageId: string;
  tenantId: string;
  statusCode: number;
  statusLabel: string;
  createdAt: string;
}

export interface ActivitySummary {
  total: number;
  accepted: number;
  duplicate: number;
  rateLimited: number;
  validationErrors: number;
  failures: number;
}

const STORAGE_KEY = 'mccig_console_activity';
export const ACTIVITY_EVENT_NAME = 'mccig:activity-updated';

export function addActivity(record: Omit<ActivityRecord, 'id' | 'createdAt'>): ActivityRecord {
  const entry: ActivityRecord = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    ...record,
  };

  const existing = readAll();
  existing.unshift(entry);
  const sliced = existing.slice(0, 500);
  writeAll(sliced);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ACTIVITY_EVENT_NAME));
  }

  return entry;
}

export function listRecent(limit = 20): ActivityRecord[] {
  return readAll().slice(0, Math.max(1, limit));
}

export function summarize(): ActivitySummary {
  const entries = readAll();

  return entries.reduce<ActivitySummary>(
    (acc, item) => {
      acc.total += 1;

      if (item.statusCode === 201) {
        acc.accepted += 1;
      } else if (item.statusCode === 200) {
        acc.duplicate += 1;
      } else if (item.statusCode === 429) {
        acc.rateLimited += 1;
      } else if (item.statusCode === 400) {
        acc.validationErrors += 1;
      } else if (item.statusCode >= 500) {
        acc.failures += 1;
      }

      return acc;
    },
    {
      total: 0,
      accepted: 0,
      duplicate: 0,
      rateLimited: 0,
      validationErrors: 0,
      failures: 0,
    },
  );
}

function readAll(): ActivityRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ActivityRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (_error) {
    return [];
  }
}

function writeAll(entries: ActivityRecord[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
