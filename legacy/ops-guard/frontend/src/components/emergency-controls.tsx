"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const CHAOS_URL = "http://localhost:3001/chaos";

export function EmergencyControls() {
  const [dbFailure, setDbFailure] = useState(false);
  const [highLatency, setHighLatency] = useState(false);
  const [lockdownActive, setLockdownActive] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);

  // Hydrate switches from backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(CHAOS_URL);
        const data = await res.json();
        setDbFailure(Boolean(data.injectError));
        setHighLatency(Boolean(data.injectLatency));
        setLockdownActive(Boolean(data.circuitBreakerEnabled));
      } catch (e) {
        // ignore for demo
      }
    };
    load();
  }, []);

  const updateChaos = async (config: any) => {
    try {
      await fetch(CHAOS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
    } catch (e) {
      console.error("Failed to update chaos config", e);
    }
  };

  const handleDbFailureChange = (checked: boolean) => {
    setDbFailure(checked);
    updateChaos({ injectError: checked });
  };

  const handleLatencyChange = (checked: boolean) => {
    setHighLatency(checked);
    updateChaos({ injectLatency: checked });
  };

  const completeLockdown = () => {
    setLockdownActive(true);
    setIsHolding(false);
    setHoldProgress(0);
    updateChaos({ circuitBreakerEnabled: true });
  };

  const startHold = () => {
    if (lockdownActive) {
      // simple toggle off when already active
      setLockdownActive(false);
      updateChaos({ circuitBreakerEnabled: false });
      return;
    }

    setIsHolding(true);
    setHoldProgress(0);

    progressTimer.current = setInterval(() => {
      setHoldProgress((p) => {
        if (p >= 100) return 100;
        return p + 5;
      });
    }, 50);

    holdTimer.current = setTimeout(() => {
      completeLockdown();
      if (progressTimer.current) clearInterval(progressTimer.current);
    }, 1000);
  };

  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    setIsHolding(false);
    setHoldProgress(0);
  };

  return (
    <Card className="bg-slate-900 border-rose-900/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono font-bold text-rose-500 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Emergency Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {/* Row 1: DB Failure */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="db-fail" className="text-slate-200 font-mono text-xs">
              Simulate DB Failure (Redis)
            </Label>
            <p className="text-[10px] text-slate-500">Injects 500-level errors</p>
          </div>
          <Switch id="db-fail" checked={dbFailure} onCheckedChange={handleDbFailureChange} />
        </div>

        {/* Row 2: High Latency */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="latency" className="text-slate-200 font-mono text-xs">
              Simulate High Latency
            </Label>
            <p className="text-[10px] text-slate-500">Adds 2000ms delay upstream</p>
          </div>
          <Switch id="latency" checked={highLatency} onCheckedChange={handleLatencyChange} />
        </div>

        {/* Row 3: Emergency Lockdown */}
        <div className="pt-2 border-t border-rose-900/20">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-rose-400 font-mono text-xs font-bold">EMERGENCY LOCKDOWN</Label>
            <Switch
              id="lockdown"
              checked={lockdownActive}
              onCheckedChange={() => {
                if (lockdownActive) {
                  setLockdownActive(false);
                  updateChaos({ circuitBreakerEnabled: false });
                }
              }}
              className="data-[state=checked]:bg-rose-600"
            />
          </div>
          <p className="text-[10px] text-rose-500/80 mb-3">
            Hold the button to engage circuit breaker. Rejects all non-essential traffic.
          </p>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-full relative overflow-hidden bg-rose-600 hover:bg-rose-700 disabled:bg-rose-900 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-lg transition-all uppercase tracking-wider text-sm shadow-lg shadow-rose-600/30"
                  style={{ fontFamily: "Geist Mono, monospace" }}
                  onMouseDown={startHold}
                  onMouseUp={cancelHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={startHold}
                  onTouchEnd={cancelHold}
                  disabled={false}
                >
                  {lockdownActive && (
                    <span className="absolute inset-0 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 animate-pulse" />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {lockdownActive ? "LOCKDOWN ACTIVE" : isHolding ? "HOLD..." : "EMERGENCY LOCKDOWN"}
                  </span>
                  {isHolding && (
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-white/50 transition-all"
                      style={{ width: `${holdProgress}%` }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Hold for 1 second to activate</p>
                <p className="text-xs text-slate-400">Rejects all non-essential traffic</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {lockdownActive && (
            <div className="mt-4 p-3 bg-rose-950/30 border border-rose-600/50 rounded-lg">
              <p className="text-xs text-rose-400 text-center" style={{ fontFamily: "Geist Mono, monospace" }}>
                🚨 All non-essential traffic is being rejected
              </p>
              <button
                onClick={() => {
                  setLockdownActive(false);
                  updateChaos({ circuitBreakerEnabled: false });
                }}
                className="w-full mt-2 text-xs text-rose-300 hover:text-rose-100 underline"
              >
                Deactivate Lockdown
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
