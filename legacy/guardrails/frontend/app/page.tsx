"use client";

import { useState } from 'react';
import { BarChart3, Menu, X, Bell, Settings, User } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { DiffTable } from './components/DiffTable';
import { GuardrailSidebar } from './components/GuardrailSidebar';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsPanel } from './components/NotificationsPanel';
import { ProfileDropdown } from './components/ProfileDropdown';
import { DocumentationModal } from './components/DocumentationModal';
import { SupportModal } from './components/SupportModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { APIReferenceModal } from './components/APIReferenceModal';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showAPIReference, setShowAPIReference] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sentinel</h1>
                <p className="text-xs text-gray-600">LLM Quality & Compliance Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowNotifications(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">AI Engineer</p>
                  <p className="text-xs text-gray-600">engineer@company.com</p>
                </div>
              </button>
              {showProfile && (
                <ProfileDropdown 
                  onClose={() => setShowProfile(false)} 
                  onOpenSettings={() => setShowSettings(true)}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Top Bar with Metrics */}
      <TopBar />

      {/* Main Content */}
      <main className="px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Table */}
          <div className="flex-1 min-w-0">
            <DiffTable />
          </div>

          {/* Sidebar - Desktop */}
          <div className="hidden lg:block">
            <GuardrailSidebar />
          </div>

          {/* Sidebar - Mobile Overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
              <div 
                className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Guardrail Metrics</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <GuardrailSidebar />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-8 py-4 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <button 
              onClick={() => setShowDocumentation(true)}
              className="hover:text-gray-900 transition-colors"
            >
              Documentation
            </button>
            <button 
              onClick={() => setShowAPIReference(true)}
              className="hover:text-gray-900 transition-colors"
            >
              API Reference
            </button>
            <button 
              onClick={() => setShowSupport(true)}
              className="hover:text-gray-900 transition-colors"
            >
              Support
            </button>
            <button 
              onClick={() => setShowPrivacyPolicy(true)}
              className="hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </button>
          </div>
          <div className="text-sm text-gray-600">
            © 2026 Sentinel. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {showDocumentation && <DocumentationModal onClose={() => setShowDocumentation(false)} />}
      {showAPIReference && <APIReferenceModal onClose={() => setShowAPIReference(false)} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showPrivacyPolicy && <PrivacyPolicyModal onClose={() => setShowPrivacyPolicy(false)} />}
    </div>
  );
}
