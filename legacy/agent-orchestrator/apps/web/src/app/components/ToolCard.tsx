import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ToolCardProps {
  method: string;
  endpoint: string;
  status: 'success' | 'error' | 'loading' | 'timeout';
  latency: number;
  input: any;
  output: any;
  error?: string;
  isInitialOpen?: boolean;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  method,
  endpoint,
  status,
  latency,
  input,
  output,
  error,
  isInitialOpen = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(isInitialOpen);

  const statusColors = {
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    timeout: 'bg-red-500/10 text-red-500 border-red-500/20',
    loading: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const statusIcon = {
    success: <CheckCircle2 size={14} />,
    error: <AlertCircle size={14} />,
    timeout: <Clock size={14} />,
    loading: <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Clock size={14} /></motion.div>,
  };

  return (
    <div className={cn(
      "rounded-lg border bg-zinc-900/50 overflow-hidden transition-all duration-200",
      status === 'error' || status === 'timeout' ? "border-red-500/30" : "border-zinc-800"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
            statusColors[status]
          )}>
            {method}
          </div>
          <span className="text-zinc-300 font-mono text-xs truncate max-w-[180px]">
            {endpoint}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className={cn(
            "text-[10px] font-mono",
            latency > 1000 ? "text-red-400" : "text-zinc-500"
          )}>
            {latency}ms
          </span>
          <div className={cn("flex items-center gap-1.5", statusColors[status].split(' ')[1])}>
            {statusIcon[status]}
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-zinc-800 pt-3">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Input Arguments</div>
            <pre className="p-2 rounded bg-black/40 text-xs font-mono text-zinc-400 overflow-x-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
              {status === 'error' || status === 'timeout' ? 'Error Output' : 'Response Result'}
            </div>
            <pre className={cn(
              "p-2 rounded text-xs font-mono overflow-x-auto",
              status === 'error' || status === 'timeout' ? "bg-red-500/5 text-red-300" : "bg-black/40 text-emerald-400"
            )}>
              {JSON.stringify(status === 'error' || status === 'timeout' ? { error: error || 'Request Timeout' } : output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
