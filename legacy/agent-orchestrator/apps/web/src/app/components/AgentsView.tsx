import React from 'react';
import { Bot, Power, Cpu, Shield, ArrowUpRight, BarChart3 } from 'lucide-react';

const AGENTS = [
  { id: 'ag-1', name: 'Support Concierge', status: 'Active', version: 'v2.4.1', model: 'gpt-4o', health: 98, uptime: '14d 2h' },
  { id: 'ag-2', name: 'Billing Assistant', status: 'Maintenance', version: 'v1.1.0', model: 'gpt-4o-mini', health: 45, uptime: '0d 0h' },
  { id: 'ag-3', name: 'DevOps Automator', status: 'Active', version: 'v3.0.0', model: 'claude-3-5-sonnet', health: 100, uptime: '45d 8h' },
  { id: 'ag-4', name: 'Data Pipeline Bot', status: 'Inactive', version: 'v0.9.5', model: 'gpt-3.5-turbo', health: 0, uptime: '0d 0h' },
];

export const AgentsView: React.FC = () => {
  return (
    <div className="flex-1 p-8 bg-zinc-950 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Agent Fleet</h1>
            <p className="text-zinc-500 text-sm">Monitor and manage your active AI agent instances.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors flex items-center gap-2">
            <Bot size={14} />
            DEPLOY NEW AGENT
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-2">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Active</p>
            <p className="text-3xl font-mono">12</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-2">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Avg Response Time</p>
            <p className="text-3xl font-mono text-emerald-500">420ms</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-2">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Error Rate (24h)</p>
            <p className="text-3xl font-mono text-red-500">0.42%</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-2">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tokens / Sec</p>
            <p className="text-3xl font-mono">84.2k</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-800/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Health</th>
                <th className="px-6 py-4">Uptime</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {AGENTS.map((agent) => (
                <tr key={agent.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <Bot size={16} className="text-zinc-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-200">{agent.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{agent.version}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        agent.status === 'Active' ? 'bg-emerald-500' : 
                        agent.status === 'Maintenance' ? 'bg-amber-500' : 'bg-zinc-600'
                      }`} />
                      <span className="text-xs text-zinc-300">{agent.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-blue-400 bg-blue-400/5 px-2 py-1 rounded border border-blue-400/20">
                      {agent.model}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full max-w-[60px]">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${agent.health}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">{agent.health}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-zinc-400">{agent.uptime}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-zinc-700 rounded transition-colors text-zinc-500">
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
