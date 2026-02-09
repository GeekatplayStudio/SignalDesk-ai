"use client";

import { ChevronDown } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useState } from 'react';
import { ApprovalModal } from './ApprovalModal';

interface Version {
  id: string;
  label: string;
}

interface TopBarProps {
  onVersionChange?: (baseline: string, candidate: string) => void;
}

export function TopBar({ onVersionChange }: TopBarProps) {
  const [baselineOpen, setBaselineOpen] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [baseline, setBaseline] = useState('v1.0');
  const [candidate, setCandidate] = useState('v1.2');
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const versions: Version[] = [
    { id: 'v0.8', label: 'v0.8' },
    { id: 'v0.9', label: 'v0.9' },
    { id: 'v1.0', label: 'v1.0' },
    { id: 'v1.1', label: 'v1.1' },
    { id: 'v1.2', label: 'v1.2' },
    { id: 'v1.3', label: 'v1.3' },
  ];

  const handleBaselineChange = (version: string) => {
    setBaseline(version);
    setBaselineOpen(false);
    onVersionChange?.(version, candidate);
  };

  const handleCandidateChange = (version: string) => {
    setCandidate(version);
    setCandidateOpen(false);
    onVersionChange?.(baseline, version);
  };

  const handleApprove = () => {
    setShowApprovalModal(false);
    // Show success notification or redirect
    alert(`Successfully deployed ${candidate} to production!`);
  };

  return (
    <>
    <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Release Candidate Comparison</h2>
          
          {/* Baseline Dropdown */}
          <div className="relative">
            <button
              onClick={() => setBaselineOpen(!baselineOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              Baseline: {baseline}
              <ChevronDown className="w-4 h-4" />
            </button>
            {baselineOpen && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => handleBaselineChange(version.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                      baseline === version.id ? 'bg-gray-100 font-medium' : ''
                    }`}
                  >
                    {version.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-gray-400">vs</span>

          {/* Candidate Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCandidateOpen(!candidateOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium text-blue-700"
            >
              Candidate: {candidate}
              <ChevronDown className="w-4 h-4" />
            </button>
            {candidateOpen && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => handleCandidateChange(version.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                      candidate === version.id ? 'bg-blue-50 font-medium' : ''
                    }`}
                  >
                    {version.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
            Export Report
          </button>
          <button 
            onClick={() => setShowApprovalModal(true)}
            className="px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#0ea574] transition-colors text-sm font-medium"
          >
            Approve Candidate
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Pass Rate"
          value="94%"
          change="+2.1% improvement"
          isPositive={true}
        />
        <MetricCard
          title="Avg Cost/Run"
          value="$0.05"
          change="-10% savings"
          isPositive={true}
        />
        <MetricCard
          title="Latency"
          value="1.2s"
          change="+200ms"
          isPositive={false}
          isRegression={true}
        />
      </div>
    </div>

    {/* Approval Modal */}
    {showApprovalModal && (
      <ApprovalModal
        onClose={() => setShowApprovalModal(false)}
        onApprove={handleApprove}
        baseline={baseline}
        candidate={candidate}
      />
    )}
    </>
  );
}
