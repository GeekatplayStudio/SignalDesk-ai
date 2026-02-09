import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Clock, AlertCircle, Wrench, CheckCircle } from "lucide-react";

interface TimelineEvent {
  time: string;
  type: "deployment" | "alert" | "mitigation" | "info";
  message: string;
}

const events: TimelineEvent[] = [
  {
    time: "10:00:01",
    type: "deployment",
    message: "Deployment v1.2 started",
  },
  {
    time: "10:02:15",
    type: "alert",
    message: "Alert: High Latency detected",
  },
  {
    time: "10:02:45",
    type: "mitigation",
    message: "Auto-Mitigation: Retry logic disabled",
  },
  {
    time: "10:03:12",
    type: "alert",
    message: "Alert: Error rate exceeding SLA threshold",
  },
  {
    time: "10:03:30",
    type: "info",
    message: "Database connection pool expanded to 200",
  },
  {
    time: "10:04:01",
    type: "alert",
    message: "Critical: p99 latency at 2400ms",
  },
  {
    time: "10:04:30",
    type: "mitigation",
    message: "Circuit breaker enabled for Redis",
  },
  {
    time: "10:05:10",
    type: "deployment",
    message: "Rollback initiated to v1.1",
  },
];

export function IncidentTimeline() {
  const getIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "deployment":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case "mitigation":
        return <Wrench className="h-4 w-4 text-amber-500" />;
      case "info":
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getBgColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "deployment":
        return "bg-emerald-950/30 border-emerald-600/30";
      case "alert":
        return "bg-rose-950/30 border-rose-600/30";
      case "mitigation":
        return "bg-amber-950/30 border-amber-600/30";
      case "info":
        return "bg-slate-950/30 border-slate-700/30";
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Incident Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getBgColor(event.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">{getIcon(event.type)}</div>
              <div className="flex-1">
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-sm text-slate-400 font-semibold"
                    style={{ fontFamily: "Geist Mono, monospace" }}
                  >
                    {event.time}
                  </span>
                  <span
                    className="text-sm text-slate-300"
                    style={{ fontFamily: "Geist Mono, monospace" }}
                  >
                    {event.message}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
