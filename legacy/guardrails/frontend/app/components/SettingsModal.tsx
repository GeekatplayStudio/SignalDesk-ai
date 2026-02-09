import { X, Bell, Shield, Palette, Database, Key, Users, Mail, Globe, Save } from 'lucide-react';
"use client";

import { useState } from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'team' | 'integrations'>('general');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(true);
  const [regressionAlerts, setRegressionAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [autoApproval, setAutoApproval] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Database },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 p-4 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Sentinel Platform"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Baseline Version
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>v1.0 (Current)</option>
                        <option>v0.9</option>
                        <option>v0.8</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>UTC (Coordinated Universal Time)</option>
                        <option>EST (Eastern Standard Time)</option>
                        <option>PST (Pacific Standard Time)</option>
                        <option>GMT (Greenwich Mean Time)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">Email Notifications</div>
                        <div className="text-xs text-gray-600">
                          Receive important updates and alerts via email
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={slackNotifications}
                        onChange={(e) => setSlackNotifications(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">Slack Notifications</div>
                        <div className="text-xs text-gray-600">
                          Get notified in your Slack workspace
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={regressionAlerts}
                        onChange={(e) => setRegressionAlerts(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">Regression Alerts</div>
                        <div className="text-xs text-gray-600">
                          Immediate alerts when critical regressions are detected
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={weeklyReports}
                        onChange={(e) => setWeeklyReports(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">Weekly Reports</div>
                        <div className="text-xs text-gray-600">
                          Receive a summary of your model's performance every week
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={twoFactorAuth}
                        onChange={(e) => setTwoFactorAuth(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">Two-Factor Authentication</div>
                        <div className="text-xs text-gray-600">
                          Add an extra layer of security to your account
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={autoApproval}
                        onChange={(e) => setAutoApproval(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">Require Manual Approval</div>
                        <div className="text-xs text-gray-600">
                          All deployments must be manually approved by authorized users
                        </div>
                      </div>
                    </label>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">API Keys</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Key className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Production API Key</div>
                              <div className="text-xs text-gray-600">sk-prod-••••••••••••</div>
                            </div>
                          </div>
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Rotate
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Key className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">Development API Key</div>
                              <div className="text-xs text-gray-600">sk-dev-••••••••••••</div>
                            </div>
                          </div>
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Rotate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                      Invite Member
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'Sarah Chen', email: 'sarah@company.com', role: 'Admin', status: 'Active' },
                      { name: 'Mike Johnson', email: 'mike@company.com', role: 'Engineer', status: 'Active' },
                      { name: 'Emma Davis', email: 'emma@company.com', role: 'Engineer', status: 'Active' },
                      { name: 'Alex Kumar', email: 'alex@company.com', role: 'Viewer', status: 'Pending' },
                    ].map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-xs text-gray-600">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {member.role}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {member.status}
                          </span>
                          <button className="text-sm text-gray-600 hover:text-gray-900">•••</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Integrations</h3>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'Slack', description: 'Get notifications in your workspace', connected: true, icon: '💬' },
                      { name: 'GitHub', description: 'Link test cases to pull requests', connected: true, icon: '🐙' },
                      { name: 'Jira', description: 'Create tickets for regressions', connected: false, icon: '📋' },
                      { name: 'PagerDuty', description: 'Alert on-call engineers', connected: false, icon: '🚨' },
                      { name: 'Datadog', description: 'Export metrics and logs', connected: true, icon: '📊' },
                    ].map((integration, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                            {integration.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                            <div className="text-xs text-gray-600">{integration.description}</div>
                          </div>
                        </div>
                        {integration.connected ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              Connected
                            </span>
                            <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
