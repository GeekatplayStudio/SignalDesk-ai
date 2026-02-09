import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { 
  ShieldAlert, 
  Activity, 
  Brain, 
  Database, 
  Hash, 
  Clock, 
  AlertTriangle,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContextSidebarProps {
  slots: Record<string, unknown>;
  status: 'active' | 'handoff' | 'closed';
  avgLatencyMs: number;
  errorRatePct: number;
  confidence: number;
  latencyData: Array<{ val: number }>;
  errorData: Array<{ val: number }>;
  onEmergencyTakeover?: () => void;
}

const fallbackLatencyData = [{ val: 0 }];
const fallbackErrorData = [{ val: 0 }];

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  slots,
  status,
  avgLatencyMs,
  errorRatePct,
  confidence,
  latencyData,
  errorData,
  onEmergencyTakeover,
}) => {
  const sessionIntent = String(slots.intent || 'unknown');
  const targetDate = String(slots.date || 'not_set');
  const tokenUsage = String(slots.token_usage || 'n/a');
  const userEmail = String(slots.email || 'n/a');
  const availableSlots = Array.isArray(slots.available_slots) ? slots.available_slots.length : 0;
  const requiresReview = confidence < 0.7 || status === 'handoff';

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-4 space-y-6 overflow-y-auto scrollbar-hide">
      {/* Health Checks */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Health Checks</h2>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Avg Latency</p>
                <p className={cn("text-xl font-mono", avgLatencyMs > 1000 ? "text-red-400" : "text-zinc-200")}>
                  {avgLatencyMs}ms
                </p>
              </div>
              <Activity size={14} className="text-emerald-500" />
            </div>
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData.length ? latencyData : fallbackLatencyData}>
                  <Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b98133" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Tool Error Rate</p>
                <p className={cn("text-xl font-mono", errorRatePct > 10 ? "text-red-500" : "text-emerald-500")}>
                  {errorRatePct}%
                </p>
              </div>
              <ShieldAlert size={14} className="text-red-500" />
            </div>
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={errorData.length ? errorData : fallbackErrorData}>
                  <Area type="monotone" dataKey="val" stroke="#ef4444" fill="#ef444433" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Conversation Slots */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Session Context</h2>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg divide-y divide-zinc-800">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">Session Status</span>
            </div>
            <span className={cn("text-xs font-mono", status === 'handoff' ? "text-red-400" : "text-zinc-200")}>
              {status}
            </span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">Intent</span>
            </div>
            <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">{sessionIntent}</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">Target Date</span>
            </div>
            <span className="text-xs font-mono text-amber-500">{targetDate}</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">User Email</span>
            </div>
            <span className="text-xs font-mono text-zinc-200">{userEmail}</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">Slots Found</span>
            </div>
            <span className="text-xs font-mono text-zinc-200">{availableSlots}</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-400">Token Usage</span>
            </div>
            <span className="text-xs font-mono text-zinc-200">{tokenUsage}</span>
          </div>
        </div>
      </section>

      {/* Control Panel */}
      <section className="mt-auto pt-6 space-y-4">
        <div className={cn(
          "p-3 rounded-lg border flex gap-3",
          requiresReview ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20"
        )}>
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <p className={cn(
            "text-[11px] leading-relaxed",
            requiresReview ? "text-amber-200/70" : "text-emerald-200/70"
          )}>
            {requiresReview
              ? `AI confidence is below threshold (${confidence.toFixed(2)}). Recommend manual review.`
              : `AI confidence is stable (${confidence.toFixed(2)}). Automatic execution is healthy.`}
          </p>
        </div>
        
        <button
          onClick={onEmergencyTakeover}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.3)]"
        >
          <Zap size={16} />
          EMERGENCY TAKEOVER
        </button>
        <button className="w-full border border-zinc-700 hover:bg-zinc-800 text-zinc-400 text-xs font-bold py-2 rounded-lg transition-colors">
          RESTART AGENT
        </button>
      </section>
    </div>
  );
};
