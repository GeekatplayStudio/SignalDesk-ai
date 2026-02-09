import { X, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, Target, Shield } from 'lucide-react';
"use client";

import { useState } from 'react';

interface ApprovalModalProps {
  onClose: () => void;
  onApprove: () => void;
  baseline: string;
  candidate: string;
}

export function ApprovalModal({ onClose, onApprove, baseline, candidate }: ApprovalModalProps) {
  const [notes, setNotes] = useState('');
  const [notifyTeam, setNotifyTeam] = useState(true);
  const [autoRollback, setAutoRollback] = useState(false);
  const [step, setStep] = useState<'review' | 'confirming' | 'success'>('review');

  const handleApprove = () => {
    setStep('confirming');
    // Simulate approval process
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onApprove();
      }, 2000);
    }, 1500);
  };

  if (step === 'confirming') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Approving Candidate...</h3>
          <p className="text-sm text-gray-600">
            Deploying {candidate} to production environment
          </p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Deployment Successful!</h3>
          <p className="text-sm text-gray-600 mb-4">
            {candidate} has been approved and deployed to production
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-gray-700">
            <p className="font-medium mb-1">Next Steps:</p>
            <ul className="text-left text-xs space-y-1">
              <li>• Monitoring dashboards are active</li>
              <li>• Team has been notified</li>
              <li>• Rollback available for 24 hours</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Approve Release Candidate</h2>
            <p className="text-sm text-blue-100 mt-1">Deploy {candidate} to production</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Summary Metrics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Pass Rate</span>
                  <TrendingUp className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="text-2xl font-bold text-gray-900">94%</div>
                <div className="text-xs text-[#10B981] font-medium mt-1">+2.1% improvement</div>
              </div>

              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Cost Savings</span>
                  <TrendingDown className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="text-2xl font-bold text-gray-900">$0.05</div>
                <div className="text-xs text-[#10B981] font-medium mt-1">-10% savings</div>
              </div>

              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Latency</span>
                  <TrendingUp className="w-4 h-4 text-[#EF4444]" />
                </div>
                <div className="text-2xl font-bold text-gray-900">1.2s</div>
                <div className="text-xs text-[#EF4444] font-medium mt-1">+200ms regression</div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">Critical Regressions</h4>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">2 found</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    2 test cases show critical safety violations (TC-1024, TC-1030)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">Performance Impact</h4>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Medium</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Latency increased by 200ms (20% slower than baseline)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">Cost Optimization</h4>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Positive</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    10% cost reduction while maintaining quality standards
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Coverage */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Coverage</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">1,247</div>
                <div className="text-xs text-gray-600">Total Tests</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-[#10B981] mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">1,172</div>
                <div className="text-xs text-gray-600">Passed</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-[#EF4444] mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">75</div>
                <div className="text-xs text-gray-600">Failed</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">165</div>
                <div className="text-xs text-gray-600">Guardrails</div>
              </div>
            </div>
          </div>

          {/* Deployment Notes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this deployment (optional)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              rows={4}
            />
          </div>

          {/* Deployment Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Options</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyTeam}
                  onChange={(e) => setNotifyTeam(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">Notify Team</div>
                  <div className="text-xs text-gray-600">
                    Send deployment notification to all team members via email and Slack
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoRollback}
                  onChange={(e) => setAutoRollback(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">Enable Auto-Rollback</div>
                  <div className="text-xs text-gray-600">
                    Automatically rollback if error rate exceeds 5% in the first hour
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-[#F59E0B] mb-1">Review Required</h4>
                <p className="text-sm text-gray-700 mb-2">
                  This candidate has critical regressions. Please review the failed test cases before approving.
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Safety violations detected in jailbreak tests</li>
                  <li>• Medical advice guardrails showing inconsistent behavior</li>
                  <li>• Consider staging deployment or additional testing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Deploying: <span className="font-medium text-gray-900">{baseline}</span> → <span className="font-medium text-blue-600">{candidate}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#0ea574] transition-colors text-sm font-medium shadow-sm"
            >
              Approve & Deploy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
