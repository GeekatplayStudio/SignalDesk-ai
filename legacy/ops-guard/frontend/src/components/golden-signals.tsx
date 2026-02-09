"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "./ui/card";
import { TrendingUp, AlertTriangle, Clock, Gauge } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface GoldenSignalsProps {
  onErrorRateClick: () => void;
}

const idleHistory = Array(20)
  .fill(0)
  .map((_, i) => ({ time: i, value: 1000 + Math.random() * 200 }));

export function GoldenSignals({ onErrorRateClick }: GoldenSignalsProps) {
  const { data: metrics } = useSWR("http://localhost:3001/metrics", fetcher, {
    refreshInterval: 1000,
  });

  const rps = metrics?.rps ?? 0;
  const errorRate = metrics?.errorRate ?? 0;
  const latency = metrics?.p95Latency ?? 0;
  const burnRate = metrics?.burnRate ?? 0;
  const budgetRemaining = metrics?.errorBudgetRemaining ?? 99.9;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pt-6">
      {/* Traffic Card */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Request Rate</p>
              <h3 className="text-3xl font-mono font-bold text-emerald-400 mt-1">{rps.toLocaleString()} RPS</h3>
            </div>
            <TrendingUp className="text-emerald-500/50 w-5 h-5" />
          </div>
          <div className="h-[60px] w-full mt-4 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={idleHistory}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTraffic)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Error Budget / SLO Card */}
      <Card
        className="bg-slate-900 border-slate-800 overflow-hidden relative group cursor-pointer hover:border-rose-900/50 transition-colors"
        onClick={onErrorRateClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">SLO / Error Budget</p>
              <h3
                className={`text-3xl font-mono font-bold mt-1 ${errorRate > 0.5 ? "text-rose-500 animate-pulse" : "text-slate-200"}`}
              >
                {budgetRemaining.toFixed(3)}% budget left
              </h3>
              <p className="text-xs text-slate-500 font-mono">Burn rate: {burnRate.toFixed(2)}x</p>
            </div>
            <Gauge className={`w-5 h-5 ${burnRate > 1 ? "text-rose-500" : "text-emerald-500"}`} />
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${errorRate > 0.5 ? "bg-rose-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min((errorRate / 0.1) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">SLO: 99.9%</span>
          </div>
          {errorRate > 0.5 && <p className="text-rose-400 text-xs mt-2 font-mono">Budget burn breaching SLO</p>}
        </CardContent>
      </Card>

      {/* Latency Card */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">P95 Latency</p>
              <h3
                className={`text-3xl font-mono font-bold mt-1 ${latency > 1000 ? "text-amber-400" : "text-emerald-400"}`}
              >
                {latency}ms
              </h3>
            </div>
            <Clock className="text-amber-500/50 w-5 h-5" />
          </div>
          <div className="h-[60px] w-full mt-4 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={idleHistory}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={latency > 1000 ? "#f59e0b" : "#10b981"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={latency > 1000 ? "#f59e0b" : "#10b981"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={latency > 1000 ? "#f59e0b" : "#10b981"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLatency)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
