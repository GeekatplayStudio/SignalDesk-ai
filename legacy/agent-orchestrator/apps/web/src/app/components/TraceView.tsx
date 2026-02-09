import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Search, Calendar, Database, ArrowRight, Loader2 } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TraceEvent {
  id: string;
  type: 'thinking' | 'tool' | 'observation' | 'error';
  content: string;
  timestamp: string;
  toolData?: any;
  status?: 'success' | 'error' | 'loading' | 'timeout';
  latency?: number;
}

interface TraceViewProps {
  events: TraceEvent[];
}

export const TraceView: React.FC<TraceViewProps> = ({ events }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Trace Brain</h2>
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-emerald-500" />
          <span className="text-[10px] text-zinc-500 font-mono">GPT-4O-LATEST</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide relative">
        <div className="absolute left-[33px] top-6 bottom-6 w-px bg-zinc-800" />

        <div className="space-y-8">
          {events.map((event, idx) => (
            <div key={event.id} className="relative pl-10">
              {/* Vertical line indicator */}
              <div className={cn(
                "absolute left-0 w-4 h-4 rounded-full border-4 border-zinc-950 flex items-center justify-center z-10",
                event.type === 'thinking' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" :
                event.type === 'tool' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" :
                event.type === 'observation' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
              )}>
                {event.status === 'loading' && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 border-2 border-white/30 rounded-full"
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      event.type === 'thinking' ? "text-amber-500" :
                      event.type === 'tool' ? "text-blue-500" :
                      event.type === 'observation' ? "text-emerald-500" :
                      "text-red-500"
                    )}>
                      {event.type}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono">{event.timestamp}</span>
                  </div>
                  {event.latency && (
                    <span className={cn(
                      "text-[10px] font-mono",
                      event.latency > 1000 ? "text-red-400" : "text-zinc-500"
                    )}>
                      {event.latency}ms
                    </span>
                  )}
                </div>

                {event.type === 'thinking' && (
                  <div className="text-zinc-400 text-sm font-mono leading-relaxed bg-zinc-900/30 p-3 rounded border border-zinc-800/50">
                    {event.status === 'loading' ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-zinc-600" />
                        <span className="animate-pulse">Analyzing user intent...</span>
                      </div>
                    ) : (
                      event.content
                    )}
                  </div>
                )}

                {event.type === 'tool' && event.toolData && (
                  <ToolCard
                    method={event.toolData.method}
                    endpoint={event.toolData.endpoint}
                    status={event.status || 'success'}
                    latency={event.latency || 0}
                    input={event.toolData.input}
                    output={event.toolData.output}
                    error={event.toolData.error}
                    isInitialOpen={event.status === 'error' || event.status === 'timeout'}
                  />
                )}

                {event.type === 'observation' && (
                  <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-2 rounded text-xs text-emerald-400/80 font-mono">
                    <Database size={12} />
                    <span>Memory Updated: {event.content}</span>
                  </div>
                )}

                {event.type === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded space-y-2">
                    <div className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase">
                      <Zap size={14} />
                      Execution Halted
                    </div>
                    <div className="text-sm text-red-300 font-mono">
                      {event.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
