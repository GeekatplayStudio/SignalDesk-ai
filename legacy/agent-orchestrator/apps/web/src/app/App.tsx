import React, { useState, useEffect } from 'react';
import { ChatFeed } from './components/ChatFeed';
import { TraceView } from './components/TraceView';
import { ContextSidebar } from './components/ContextSidebar';
import { AgentsView } from './components/AgentsView';
import { DeploymentsView } from './components/DeploymentsView';
import { Terminal, Settings, Bell, Search, User } from 'lucide-react';
import {
  createConversation,
  emergencyHandoff,
  getConversation,
  getHistory,
  getLogs,
  sendMessage,
  type ChatMessage,
  type ToolLog,
} from './api';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  isHandoff?: boolean;
};

type UiEvent = {
  id: string;
  type: 'thinking' | 'tool' | 'observation' | 'error';
  content: string;
  timestamp: string;
  toolData?: {
    method: string;
    endpoint: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    error?: string;
  };
  status?: 'success' | 'error' | 'loading' | 'timeout';
  latency?: number;
};

function formatClock(value: string) {
  return new Date(value).toLocaleTimeString();
}

function inferLoadingTool(message: string): { endpoint: string; label: string } | null {
  const lowered = message.toLowerCase();
  if (lowered.includes('availability') || lowered.includes('calendar') || lowered.includes('slot')) {
    return { endpoint: '/check_availability', label: 'Calling Calendar API...' };
  }
  if (lowered.includes('book') || lowered.includes('appointment')) {
    return { endpoint: '/book_appointment', label: 'Calling Booking API...' };
  }
  if (lowered.includes('ticket') || lowered.includes('issue') || lowered.includes('problem')) {
    return { endpoint: '/create_ticket', label: 'Calling Ticketing API...' };
  }
  if (lowered.includes('human') || lowered.includes('operator')) {
    return { endpoint: '/handoff_to_human', label: 'Preparing Human Handoff...' };
  }
  return null;
}

function mapHistoryToUiMessages(history: ChatMessage[]): UiMessage[] {
  return history
    .filter((msg) => msg.role !== 'tool')
    .map((msg) => {
      const lowered = msg.content.toLowerCase();
      return {
        id: String(msg.id),
        role: msg.role,
        content: msg.content,
        timestamp: formatClock(msg.created_at),
        isHandoff: lowered.includes('operator') || lowered.includes('handoff') || lowered.includes('takeover'),
      };
    });
}

function mapLogsToUiEvents(logs: ToolLog[]): UiEvent[] {
  const events: UiEvent[] = [];
  for (const log of logs) {
    events.push({
      id: `thinking-${log.id}`,
      type: 'thinking',
      content: `Orchestrator selected ${log.tool_name}`,
      timestamp: formatClock(log.created_at),
    });

    events.push({
      id: `tool-${log.id}`,
      type: 'tool',
      content: `Executed ${log.tool_name}`,
      status: log.status === 'timeout' ? 'timeout' : log.status === 'success' ? 'success' : 'error',
      latency: log.execution_time_ms,
      timestamp: formatClock(log.created_at),
      toolData: {
        method: 'POST',
        endpoint: `/${log.tool_name}`,
        input: log.input_params || {},
        output: log.output || {},
        error: log.error_msg || String((log.output || {}).error || ''),
      },
    });
  }
  return events;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'agents' | 'deployments'>('overview');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<'active' | 'handoff' | 'closed'>('active');
  const [slots, setSlots] = useState<Record<string, unknown>>({});
  const [avgLatencyMs, setAvgLatencyMs] = useState(0);
  const [errorRatePct, setErrorRatePct] = useState(0);
  const [confidence, setConfidence] = useState<number>(1);
  const [turnLatency, setTurnLatency] = useState<number>(0);
  const [latencySeries, setLatencySeries] = useState<Array<{ val: number }>>([]);
  const [errorSeries, setErrorSeries] = useState<Array<{ val: number }>>([]);

  useEffect(() => {
    createConversation().then((conversation) => {
      setConversationId(conversation.id);
      setConversationStatus(conversation.status);
      setSlots(conversation.slots || {});
    });
  }, []);

  const refreshData = async (id: string) => {
    if (!id) {
      return;
    }

    try {
      const [history, logs, conversation] = await Promise.all([getHistory(id), getLogs(id), getConversation(id)]);
      setMessages(mapHistoryToUiMessages(history));
      setEvents(mapLogsToUiEvents(logs));
      setConversationStatus(conversation.status);
      setSlots(conversation.slots || {});

      const latency = logs.map((log) => log.execution_time_ms);
      const avg = latency.length ? Math.round(latency.reduce((sum, item) => sum + item, 0) / latency.length) : 0;
      setAvgLatencyMs(avg);

      const failures = logs.filter((log) => log.status !== 'success').length;
      const errorRate = logs.length ? Math.round((failures / logs.length) * 100) : 0;
      setErrorRatePct(errorRate);

      setLatencySeries(logs.slice(-12).map((log) => ({ val: log.execution_time_ms })));
      setErrorSeries(
        logs.slice(-12).map((log) => ({
          val: log.status === 'success' ? 0 : 1,
        })),
      );
    } catch (e) {
      console.error('Failed to refresh data', e);
    }
  };

  const handleSend = async (text: string) => {
    if (!conversationId) {
      return;
    }

    const now = new Date().toLocaleTimeString();
    const tempMsg: UiMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: now,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setIsTyping(true);

    const tempThinkingId = `thinking-loading-${Date.now()}`;
    const loadingTool = inferLoadingTool(text);
    const loadingEvents: UiEvent[] = [
      {
        id: tempThinkingId,
        type: 'thinking',
        content: loadingTool?.label || 'Analyzing user intent...',
        timestamp: now,
        status: 'loading',
      },
    ];
    if (loadingTool) {
      loadingEvents.push({
        id: `${tempThinkingId}-tool`,
        type: 'tool',
        content: loadingTool.label,
        status: 'loading',
        latency: 0,
        timestamp: now,
        toolData: {
          method: 'POST',
          endpoint: loadingTool.endpoint,
          input: { message: text },
          output: {},
        },
      });
    }
    setEvents((prev) => [...prev, ...loadingEvents]);

    try {
      const result = await sendMessage(conversationId, text);
      setConversationStatus(result.conversation_status);
      setSlots(result.slots || {});
      setTurnLatency(result.latency_ms || 0);
      setConfidence((prev) => result.confidence ?? prev);
      await refreshData(conversationId);
    } catch (e) {
      console.error('Failed to send message', e);
      setEvents((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'error',
          content: 'Request failed before completion.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setEvents((prev) => prev.filter((event) => !event.id.startsWith(tempThinkingId)));
      setIsTyping(false);
    }
  };

  const handleEmergencyTakeover = async () => {
    if (!conversationId) {
      return;
    }
    try {
      await emergencyHandoff(conversationId);
      await refreshData(conversationId);
    } catch (error) {
      console.error('Failed to trigger emergency takeover', error);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'agents':
        return <AgentsView />;
      case 'deployments':
        return <DeploymentsView />;
      default:
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Chat Feed */}
            <div className="w-[380px] shrink-0">
              <ChatFeed messages={messages} isTyping={isTyping} onSendMessage={handleSend} />
            </div>

            {/* Middle: Brain (Trace View) */}
            <div className="flex-1 min-w-0">
              <TraceView events={events} />
            </div>

            {/* Right: State & Context */}
            <div className="w-[320px] shrink-0 border-l border-zinc-800">
              <ContextSidebar
                slots={slots}
                status={conversationStatus}
                avgLatencyMs={avgLatencyMs}
                errorRatePct={errorRatePct}
                confidence={confidence}
                latencyData={latencySeries}
                errorData={errorSeries}
                onEmergencyTakeover={handleEmergencyTakeover}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-200 font-sans selection:bg-blue-500/30">
      {/* Top Navigation */}
      <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Terminal size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">MISSION CONTROL <span className="text-zinc-500 font-normal">v2.4</span></span>
          </div>
          
          <nav className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentTab('overview')}
              className={`text-[11px] font-bold uppercase tracking-wider h-12 px-1 transition-all border-b-2 ${
                currentTab === 'overview' ? 'text-blue-500 border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setCurrentTab('agents')}
              className={`text-[11px] font-bold uppercase tracking-wider h-12 px-1 transition-all border-b-2 ${
                currentTab === 'agents' ? 'text-blue-500 border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              Agents
            </button>
            <button 
              onClick={() => setCurrentTab('deployments')}
              className={`text-[11px] font-bold uppercase tracking-wider h-12 px-1 transition-all border-b-2 ${
                currentTab === 'deployments' ? 'text-blue-500 border-blue-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              Deployments
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
            <Search size={14} className="text-zinc-500" />
            <input type="text" placeholder="Search sessions..." className="bg-transparent text-xs focus:outline-none w-48" />
          </div>
          <button className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-500">
            <Bell size={18} />
          </button>
          <button className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-500">
            <Settings size={18} />
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <User size={16} className="text-zinc-400" />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-6 bg-zinc-950 border-t border-zinc-800 px-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-500">
            <div className="w-1.5 h-1.5 rounded-full bg-current" />
            SYSTEM ONLINE
          </div>
          <span>SESSION: <span className="text-zinc-300">{conversationId ? conversationId.slice(0, 8) : 'BOOTING'}</span></span>
          <span>STATUS: <span className={conversationStatus === 'handoff' ? 'text-red-400' : 'text-zinc-300'}>{conversationStatus}</span></span>
          <span>LATENCY: <span className="text-zinc-300">{turnLatency}ms</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LN 254, COL 12</span>
          <span>PREVIEW MODE</span>
        </div>
      </footer>
    </div>
  );
}
