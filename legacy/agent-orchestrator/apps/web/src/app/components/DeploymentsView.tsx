import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Clock, CheckCircle2, XCircle, Terminal, HardDrive, Globe, Loader2, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEPLOYMENTS = [
  { id: 'dep-1', env: 'production', version: 'sha-8f2a1b', status: 'Success', triggeredBy: 'ci/cd', time: '12m ago' },
  { id: 'dep-2', env: 'staging', version: 'sha-9c3d4e', status: 'Success', triggeredBy: 'john.doe', time: '2h ago' },
  { id: 'dep-3', env: 'production', version: 'sha-1a2b3c', status: 'Failed', triggeredBy: 'ci/cd', time: '5h ago' },
  { id: 'dep-4', env: 'development', version: 'sha-5f6g7h', status: 'Success', triggeredBy: 'jane.smith', time: '1d ago' },
];

const DEPLOY_LOGS = [
  "Initializing deployment pipeline...",
  "Fetching source code from repository...",
  "Source code fetched (sha-7d2e4f)",
  "Installing dependencies...",
  "Build optimized for production environment...",
  "Running unit tests...",
  "All tests passed (142 tests)",
  "Bundling assets...",
  "Deploying to edge nodes...",
  "Verifying deployment health...",
  "Deployment successful."
];

export const DeploymentsView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deployStep, setDeployStep] = useState<'idle' | 'configuring' | 'deploying' | 'complete'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<'production' | 'staging' | 'development'>('staging');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (deployStep === 'deploying') {
      let currentLogIndex = 0;
      const interval = setInterval(() => {
        if (currentLogIndex < DEPLOY_LOGS.length) {
          setLogs(prev => [...prev, DEPLOY_LOGS[currentLogIndex]]);
          currentLogIndex++;
        } else {
          clearInterval(interval);
          setDeployStep('complete');
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [deployStep]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStartDeploy = () => {
    setDeployStep('deploying');
    setLogs([]);
  };

  const closeDeploy = () => {
    setIsModalOpen(false);
    setDeployStep('idle');
    setLogs([]);
  };

  return (
    <div className="flex-1 p-8 bg-zinc-950 overflow-y-auto relative">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Deployment Pipeline</h1>
            <p className="text-zinc-500 text-sm">Track agent deployments across all environments.</p>
          </div>
          <div className="flex gap-3">
            <button className="border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-bold px-4 py-2 rounded transition-colors flex items-center gap-2">
              <Terminal size={14} />
              CLI LOGS
            </button>
            <button 
              onClick={() => { setIsModalOpen(true); setDeployStep('configuring'); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Rocket size={14} />
              NEW DEPLOY
            </button>
          </div>
        </div>

        {/* Status Overview Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Globe size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Production</p>
                <p className="text-sm font-bold text-zinc-200">v2.4.1 (Stable)</p>
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <HardDrive size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Staging</p>
                <p className="text-sm font-bold text-zinc-200">v2.5.0-rc1</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-black/40 px-3 py-1.5 rounded-full border border-zinc-800">
            <Clock size={12} />
            LAST DEPLOY: 12m ago
          </div>
        </div>

        {/* List of Recent Deploys */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recent Deployments</h2>
          <div className="space-y-2">
            {DEPLOYMENTS.map((dep) => (
              <div key={dep.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex items-center justify-between hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-6">
                  <div className={dep.status === 'Success' ? "text-emerald-500" : "text-red-500"}>
                    {dep.status === 'Success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-200">{dep.env.toUpperCase()}</span>
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{dep.version}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">Triggered by {dep.triggeredBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs font-mono text-zinc-400">{dep.time}</p>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{dep.status}</p>
                  </div>
                  <button className="text-zinc-500 hover:text-zinc-200 transition-colors">
                    <Terminal size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deployment Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                  <div className="flex items-center gap-2">
                    <Rocket size={16} className="text-emerald-500" />
                    <span className="text-sm font-bold uppercase tracking-widest">New Deployment</span>
                  </div>
                  <button onClick={closeDeploy} className="text-zinc-500 hover:text-zinc-200">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6">
                  {deployStep === 'configuring' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Environment</label>
                        <div className="grid grid-cols-3 gap-3">
                          {(['production', 'staging', 'development'] as const).map(env => (
                            <button 
                              key={env}
                              onClick={() => setSelectedEnv(env)}
                              className={`p-4 rounded-lg border text-left transition-all ${
                                selectedEnv === env 
                                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                              }`}
                            >
                              <div className="text-xs font-bold uppercase mb-1">{env}</div>
                              <div className="text-[10px] opacity-70">Current: {env === 'production' ? 'v2.4.1' : 'v2.5.0-rc1'}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">Deployment Summary</span>
                          <span className="text-[10px] text-zinc-600 font-mono">ID: DEP-{Math.floor(Math.random() * 9000) + 1000}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Version to deploy</span>
                          <span className="text-zinc-200 font-mono">v2.5.1 (HEAD)</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">Triggered by</span>
                          <span className="text-zinc-200">System Administrator</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleStartDeploy}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      >
                        CONFIRM & DEPLOY
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {(deployStep === 'deploying' || deployStep === 'complete') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {deployStep === 'deploying' ? (
                            <Loader2 size={20} className="animate-spin text-emerald-500" />
                          ) : (
                            <CheckCircle2 size={20} className="text-emerald-500" />
                          )}
                          <span className="text-sm font-bold text-zinc-200">
                            {deployStep === 'deploying' ? 'Deploying to ' + selectedEnv : 'Deployment Complete'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">{logs.length} / {DEPLOY_LOGS.length} steps</span>
                      </div>

                      <div className="bg-black border border-zinc-800 rounded-lg h-64 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-hide">
                        {logs.map((log, i) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -5 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            key={i} 
                            className="flex gap-3"
                          >
                            <span className="text-zinc-700 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                            <span className={log.includes('successful') ? 'text-emerald-400' : 'text-zinc-400'}>
                              {log.includes('Initializing') ? <span className="text-blue-400">$ {log}</span> : log}
                            </span>
                          </motion.div>
                        ))}
                        <div ref={logEndRef} />
                      </div>

                      {deployStep === 'complete' && (
                        <motion.button 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={closeDeploy}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-lg transition-colors"
                        >
                          CLOSE MONITOR
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
