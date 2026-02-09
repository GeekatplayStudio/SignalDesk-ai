"use client";

import { Badge } from "./ui/badge";
import useSWR from "swr";
import { cn } from "./ui/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ServiceHeader() {
  const { data: metrics } = useSWR("http://localhost:3001/metrics", fetcher, { refreshInterval: 2000 });
  const errorRate = metrics?.errorRate ?? 0;
  
  let status = "HEALTHY";
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline"; // Adjusted for shadcn badge variants
  let colorClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
  let dotClass = "bg-emerald-500";

  if (errorRate > 0.5) {
      status = "DEGRADED";
      variant = "destructive";
      colorClass = "bg-rose-500/10 border-rose-500/50 text-rose-400";
      dotClass = "bg-rose-500";
  } else if (errorRate > 0.1) {
      status = "WARNING";
      variant = "secondary";
      colorClass = "bg-amber-500/10 border-amber-500/50 text-amber-400";
      dotClass = "bg-amber-500";
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100 font-mono tracking-tight">
          OpsGuard // Payment Gateway
        </h1>
        <Badge 
          variant={variant} 
          className={cn("flex items-center gap-2 px-4 py-1.5 font-mono", colorClass)}
        >
          <span className="relative flex h-2 w-2">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotClass)}></span>
            <span className={cn("relative inline-flex rounded-full h-2 w-2", dotClass)}></span>
          </span>
          Status: {status}
        </Badge>
      </div>
    </header>
  );
}
