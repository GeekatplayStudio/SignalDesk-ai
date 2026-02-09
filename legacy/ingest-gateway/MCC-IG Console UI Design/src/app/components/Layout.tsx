import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Terminal, 
  RotateCcw, 
  Activity, 
  Trash2, 
  BookOpen, 
  Menu, 
  X,
  ChevronRight,
  Database,
  Cpu,
  Globe,
  Layers
} from 'lucide-react';
import { cn } from './ui';

interface NavItem {
  id: string;
  label: string;
  icon: any;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'playground', label: 'Ingest Playground', icon: Terminal },
  { id: 'replay', label: 'Replay Verification', icon: RotateCcw },
  { id: 'monitor', label: 'Rate Limit Monitor', icon: Activity },
  { id: 'dlq', label: 'DLQ & Failures', icon: Trash2 },
  { id: 'docs', label: 'API Docs Lite', icon: BookOpen },
];

export const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen 
}: { 
  activeTab: string; 
  setActiveTab: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 z-50 transition-transform duration-300 transform lg:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Layers className="text-slate-950 w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">MCC-IG <span className="text-cyan-500">Console</span></h1>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)]" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-cyan-500" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
                {isActive && <ChevronRight className="ml-auto w-3 h-3" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">v1.4.2-stable</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export const TopBar = ({ 
  setIsOpen 
}: { 
  setIsOpen: (open: boolean) => void;
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 lg:px-8 justify-between">
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 text-slate-400 hover:text-slate-100 lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-4 ml-auto">
        <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-800">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800">
            <Globe className="w-3 h-3 text-cyan-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase">Production</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <div className="text-xs font-bold text-slate-200">Admin User</div>
            <div className="text-[10px] text-slate-500">Ops Lead</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-cyan-500/10">
            AU
          </div>
        </div>
      </div>
    </header>
  );
};
