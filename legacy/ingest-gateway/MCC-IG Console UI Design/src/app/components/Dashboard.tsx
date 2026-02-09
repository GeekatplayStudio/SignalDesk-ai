import React, { useEffect, useMemo, useState } from 'react';
import {
  Database,
  Cpu,
  Activity,
  Layers,
  AlertTriangle,
  Clock,
  MessageSquare,
  Phone,
  Hash,
} from 'lucide-react';
import { Card, Badge } from './ui';
import { KPIBox } from './ui/dashboard-elements';
import { ACTIVITY_EVENT_NAME, listRecent, summarize, type ActivityRecord } from '../lib/activityStore';
import { getHealth } from '../lib/api';

type HealthState = 'Healthy' | 'Warning' | 'Down';

export const Dashboard = () => {
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>(() => listRecent(8));
  const [summary, setSummary] = useState(() => summarize());
  const [apiHealth, setApiHealth] = useState<HealthState>('Warning');

  useEffect(() => {
    const refresh = () => {
      setActivityRecords(listRecent(8));
      setSummary(summarize());
    };

    refresh();
    window.addEventListener(ACTIVITY_EVENT_NAME, refresh);
    return () => window.removeEventListener(ACTIVITY_EVENT_NAME, refresh);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchHealth = async () => {
      try {
        const response = await getHealth();
        if (!mounted) {
          return;
        }

        setApiHealth(response.status === 200 ? 'Healthy' : 'Down');
      } catch (_error) {
        if (!mounted) {
          return;
        }

        setApiHealth('Down');
      }
    };

    fetchHealth();
    const interval = window.setInterval(fetchHealth, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const healthCards = useMemo(
    () => [
      { name: 'API Gateway', status: apiHealth, icon: Activity },
      { name: 'Redis Cache', status: 'Warning' as HealthState, icon: Layers },
      { name: 'PostgreSQL', status: 'Warning' as HealthState, icon: Database },
      { name: 'Worker Cluster', status: 'Warning' as HealthState, icon: Cpu },
    ],
    [apiHealth],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
          <p className="text-slate-400 text-sm">Real-time health and ingestion activity across channels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthCards.map((item) => (
          <Card key={item.name} className="p-4 flex items-center justify-between border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <item.icon className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">{item.name}</p>
                <p
                  className={`text-sm font-bold ${
                    item.status === 'Healthy'
                      ? 'text-success'
                      : item.status === 'Warning'
                        ? 'text-warning'
                        : 'text-destructive'
                  }`}
                >
                  {item.status}
                </p>
              </div>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                item.status === 'Healthy'
                  ? 'bg-success'
                  : item.status === 'Warning'
                    ? 'bg-warning'
                    : 'bg-destructive'
              } animate-pulse`}
            />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPIBox title="Total Ingests" value={summary.total} icon={Activity} variant="info" />
        <KPIBox title="Duplicates" value={summary.duplicate} icon={Layers} variant="warning" />
        <KPIBox title="Rate Limited (429)" value={summary.rateLimited} icon={AlertTriangle} variant="error" />
        <KPIBox title="Validation Errors" value={summary.validationErrors} icon={Cpu} variant="error" />
        <KPIBox title="Server Failures" value={summary.failures} icon={Clock} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider">Recent Activity Feed</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 font-medium border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {activityRecords.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-500">
                      No activity yet. Send requests from Ingest Playground.
                    </td>
                  </tr>
                )}
                {activityRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.channel === 'SMS' && <Hash className="w-3.5 h-3.5 text-cyan-400" />}
                        {row.channel === 'CHAT' && <MessageSquare className="w-3.5 h-3.5 text-sky-400" />}
                        {row.channel === 'VOICE' && <Phone className="w-3.5 h-3.5 text-emerald-400" />}
                        <span className="font-mono text-xs">{row.providerMessageId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.tenantId}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.statusCode === 201
                            ? 'success'
                            : row.statusCode === 200
                              ? 'warning'
                              : row.statusCode === 429
                                ? 'error'
                                : row.statusCode === 400
                                  ? 'warning'
                                  : 'error'
                        }
                      >
                        {row.statusLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">{relativeTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-slate-800 bg-slate-900/20">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Operational Notes</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <p className="text-xs text-slate-200">
                This dashboard is driven by live client activity and API health. For full system telemetry,
                add backend metrics endpoints (Redis, Postgres, Worker) to the API.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

function relativeTime(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return iso;
  }

  const deltaSeconds = Math.floor((Date.now() - parsed) / 1000);
  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  return `${Math.floor(deltaHours / 24)}d ago`;
}
