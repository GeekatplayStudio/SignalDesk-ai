"use client";

import { ServiceHeader } from "@/components/service-header";
import { GoldenSignals } from "@/components/golden-signals";
import { LiveTraces } from "@/components/live-traces";
import { EmergencyControls } from "@/components/emergency-controls";
import { IncidentTimeline } from "@/components/incident-timeline";
import { useState } from "react";

export default function DashboardPage() {
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <ServiceHeader />
      
      <main className="pb-8 space-y-6">
        {/* Golden Signals */}
        <section>
            <GoldenSignals onErrorRateClick={() => setShowErrorsOnly((prev) => !prev)} />
        </section>

        {/* Investigation & Action Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
          <div className="lg:col-span-2">
            <LiveTraces filterErrorsOnly={showErrorsOnly} />
          </div>
          <div className="lg:col-span-1">
            <EmergencyControls />
          </div>
        </div>

        {/* Incident Timeline */}
        <div className="px-6">
          <IncidentTimeline />
        </div>
      </main>
    </div>
  );
}
