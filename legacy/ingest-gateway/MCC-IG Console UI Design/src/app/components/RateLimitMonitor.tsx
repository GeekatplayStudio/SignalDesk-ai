import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, AlertTriangle, Shield } from 'lucide-react';
import { Card, Badge, Select, cn } from './ui';
import { summarize } from '../lib/activityStore';

export const RateLimitMonitor = () => {
  const summary = summarize();

  const data = useMemo(
    () => [
      { time: 'T-6', requests: 80, limited: 0 },
      { time: 'T-5', requests: 120, limited: 2 },
      { time: 'T-4', requests: 240, limited: 12 },
      { time: 'T-3', requests: 180, limited: 5 },
      { time: 'T-2', requests: 280, limited: 20 },
      { time: 'T-1', requests: 210, limited: 6 },
      { time: 'Now', requests: Math.max(50, summary.total), limited: summary.rateLimited },
    ],
    [summary.total, summary.rateLimited],
  );

  const tokenCapacity = 1000;
  const estimatedAvailable = Math.max(0, tokenCapacity - summary.rateLimited * 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rate Limit Monitor</h2>
          <p className="text-slate-400 text-sm">Monitor traffic spikes and tenant-specific rate limiting.</p>
        </div>
        <div className="w-full sm:w-64">
          <Select>
            <option>All Tenants</option>
            <option>tenant-replay</option>
            <option>t-retail-001</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Traffic vs Rate Limits</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">Requests</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <span className="text-[10px] text-slate-400 font-bold uppercase">429 Errors</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#06b6d4" fillOpacity={1} fill="url(#colorReq)" strokeWidth={2} />
                <Area type="monotone" dataKey="limited" stroke="#ef4444" fillOpacity={1} fill="url(#colorLim)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 border-slate-800 bg-slate-900/20">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Token Bucket Status</h3>
          <div className="flex flex-col items-center justify-center space-y-8 py-4">
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-2 rounded-full border-2 border-slate-800/50" />
              <div
                className="absolute bottom-0 left-0 right-0 bg-cyan-500/20 border-t border-cyan-500 rounded-b-full transition-all duration-1000"
                style={{ height: `${Math.max(5, (estimatedAvailable / tokenCapacity) * 100)}%` }}
              >
                <div className="absolute top-0 left-0 right-0 h-4 bg-cyan-400/30 -translate-y-1/2 blur-sm animate-pulse" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-100">{estimatedAvailable}</span>
                <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Available</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Refill Rate</span>
                <span className="text-slate-100 font-mono">50 tokens / sec</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Max Capacity</span>
                <span className="text-slate-100 font-mono">{tokenCapacity} tokens</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Current Health</span>
                <Badge variant={summary.rateLimited > 0 ? 'warning' : 'success'}>
                  {summary.rateLimited > 0 ? 'THROTTLING' : 'STABLE'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider">Top Noisy Tenants</h3>
            <Shield className="w-4 h-4 text-slate-500" />
          </div>
          <div className="p-4 space-y-4">
            {[
              { name: 'tenant-replay', rejected: `${Math.min(80, summary.rateLimited)}%`, color: 'bg-destructive' },
              { name: 't-retail-001', rejected: `${Math.min(30, Math.floor(summary.rateLimited / 2))}%`, color: 'bg-warning' },
              { name: 'tenant-demo', rejected: `${Math.min(10, Math.floor(summary.rateLimited / 4))}%`, color: 'bg-warning' },
            ].map((tenant) => (
              <div key={tenant.name} className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-200">{tenant.name}</span>
                  <span className="text-slate-400">{tenant.rejected} rejected</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={tenant.color} style={{ width: tenant.rejected }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-slate-800">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Rate Limit Alerts</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {[
              {
                msg:
                  summary.rateLimited > 0
                    ? 'Rate limit rejections detected. Investigate tenant traffic spikes.'
                    : 'No 429 spikes detected in recent activity.',
                time: 'now',
                severity: summary.rateLimited > 0 ? 'error' : 'info',
              },
              {
                msg: 'Token bucket settings come from backend env vars RATE_LIMIT_CAPACITY and RATE_LIMIT_REFILL_RATE.',
                time: 'info',
                severity: 'info',
              },
            ].map((alert, i) => (
              <div key={i} className="p-4 flex gap-3 hover:bg-slate-900/40 transition-colors">
                <div
                  className={cn(
                    'w-1 h-8 rounded-full shrink-0',
                    alert.severity === 'error' ? 'bg-destructive' : 'bg-cyan-500',
                  )}
                />
                <div>
                  <p className="text-xs text-slate-200 font-medium">{alert.msg}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
