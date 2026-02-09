import { Shield, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
"use client";

import { useState } from 'react';

interface GuardrailEvent {
  topic: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const interventionData = [
  { name: 'Triggered', value: 165, color: '#EF4444' },
  { name: 'Allowed', value: 835, color: '#10B981' },
];

const blockedTopics: GuardrailEvent[] = [
  { topic: 'PII (Email)', count: 140, trend: 'up', severity: 'high' },
  { topic: 'Profanity', count: 20, trend: 'down', severity: 'medium' },
  { topic: 'Competitor Mention', count: 5, trend: 'stable', severity: 'low' },
  { topic: 'Financial Advice', count: 12, trend: 'up', severity: 'high' },
  { topic: 'Medical Advice', count: 8, trend: 'down', severity: 'critical' },
  { topic: 'Illegal Activity', count: 15, trend: 'up', severity: 'critical' },
];

export function GuardrailSidebar() {
  const [showDetails, setShowDetails] = useState(false);
  
  const interventionRate = ((interventionData[0].value / (interventionData[0].value + interventionData[1].value)) * 100).toFixed(1);

  const renderCustomLabel = (entry: any) => {
    return `${entry.value}`;
  };

  return (
    <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Guardrail Metrics</h3>
        </div>
        <p className="text-sm text-gray-600">Last 24 hours</p>
      </div>

      {/* Intervention Rate */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-900 mb-1">{interventionRate}%</div>
          <div className="text-sm text-gray-600">Intervention Rate</div>
        </div>

        {/* Donut Chart */}
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={interventionData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
            >
              {interventionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            {interventionData[0].value} total interventions out of {interventionData[0].value + interventionData[1].value} requests
          </p>
        </div>
      </div>

      {/* Top Blocked Topics */}
      <div className="px-6 py-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900">Top Blocked Topics</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="space-y-3">
          {blockedTopics.map((topic, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-medium text-gray-900">{topic.topic}</h5>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      topic.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      topic.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      topic.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {topic.severity}
                    </span>
                  </div>
                  {showDetails && (
                    <p className="text-xs text-gray-600 mt-1">
                      Category: Content Safety • Source: Pattern Matching
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-semibold text-gray-900">{topic.count}</span>
                  <span className="text-xs text-gray-600">events</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {topic.trend === 'up' && (
                    <TrendingUp className="w-4 h-4 text-[#EF4444]" />
                  )}
                  {topic.trend === 'down' && (
                    <TrendingUp className="w-4 h-4 text-[#10B981] rotate-180" />
                  )}
                  {topic.trend === 'stable' && (
                    <div className="w-4 h-0.5 bg-gray-400" />
                  )}
                  <span className={`text-xs font-medium ${
                    topic.trend === 'up' ? 'text-[#EF4444]' :
                    topic.trend === 'down' ? 'text-[#10B981]' :
                    'text-gray-500'
                  }`}>
                    {topic.trend === 'up' ? '+12%' : topic.trend === 'down' ? '-8%' : '0%'}
                  </span>
                </div>
              </div>

              {showDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Last triggered:</span>
                    <span className="text-gray-900 font-medium">2 min ago</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-600">Avg. resolution:</span>
                    <span className="text-gray-900 font-medium">Blocked</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="border-t border-gray-200 px-6 py-4 bg-blue-50">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-blue-900 font-medium mb-1">Guardrail Health</p>
            <p className="text-xs text-blue-800">
              All guardrails are functioning normally. Coverage: 98.5%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
