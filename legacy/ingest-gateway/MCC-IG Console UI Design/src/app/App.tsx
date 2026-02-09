import React, { useState } from 'react';
import { Sidebar, TopBar } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { IngestPlayground } from './components/IngestPlayground';
import { ReplayVerification } from './components/ReplayVerification';
import { RateLimitMonitor } from './components/RateLimitMonitor';
import { DLQManager } from './components/DLQManager';
import { APIDocs } from './components/APIDocs';
import { Toaster } from 'sonner';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'playground':
        return <IngestPlayground />;
      case 'replay':
        return <ReplayVerification />;
      case 'monitor':
        return <RateLimitMonitor />;
      case 'dlq':
        return <DLQManager />;
      case 'docs':
        return <APIDocs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-cyan-500/30">
      <Toaster position="top-right" theme="dark" closeButton />
      
      {/* Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar setIsOpen={setSidebarOpen} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-(--breakpoint-2xl) mx-auto">
            {renderContent()}
          </div>
        </main>
        
        <footer className="p-4 border-t border-slate-800/50 text-center">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-[0.2em]">
            © 2026 MCC-IG Gateway Operations • Secure Environment
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
