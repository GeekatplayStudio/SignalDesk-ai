import { X, AlertCircle, CheckCircle, Clock, DollarSign, Tag } from 'lucide-react';
import { TestCase } from './DiffTable';

interface TestCaseModalProps {
  testCase: TestCase;
  onClose: () => void;
}

export function TestCaseModal({ testCase, onClose }: TestCaseModalProps) {
  const isRegression = testCase.baselineStatus === 'pass' && testCase.candidateStatus === 'fail';
  const isImprovement = testCase.baselineStatus === 'fail' && testCase.candidateStatus === 'pass';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between ${
          isRegression ? 'bg-red-50' : isImprovement ? 'bg-green-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">{testCase.id}</h2>
            {isRegression && (
              <span className="px-3 py-1 bg-[#EF4444] text-white text-sm font-medium rounded-full">
                REGRESSION
              </span>
            )}
            {isImprovement && (
              <span className="px-3 py-1 bg-[#10B981] text-white text-sm font-medium rounded-full">
                IMPROVED
              </span>
            )}
            {testCase.severity && (
              <span className={`px-3 py-1 text-sm font-medium rounded ${
                testCase.severity === 'critical' ? 'bg-red-100 text-red-800' :
                testCase.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                testCase.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {testCase.severity.toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Category and Tags */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <span className="text-sm text-gray-600">Category</span>
                <p className="text-base font-medium text-gray-900">{testCase.category}</p>
              </div>
            </div>
            {testCase.tags && testCase.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="flex gap-2">
                  {testCase.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Input</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-900">{testCase.input}</p>
            </div>
          </div>

          {/* Outputs Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Baseline Output */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Baseline Output (v1.0)
              </label>
              <div className={`border-2 rounded-lg p-4 ${
                testCase.baselineStatus === 'pass' 
                  ? 'border-[#10B981] bg-green-50' 
                  : 'border-[#EF4444] bg-red-50'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  {testCase.baselineStatus === 'pass' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-[#10B981]">PASS</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-[#EF4444]">FAIL</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-900">{testCase.baselineOutput}</p>
              </div>
            </div>

            {/* Candidate Output */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Output (v1.2)
              </label>
              <div className={`border-2 rounded-lg p-4 ${
                testCase.candidateStatus === 'pass' 
                  ? 'border-[#10B981] bg-green-50' 
                  : 'border-[#EF4444] bg-red-50'
              }`}>
                <div className="flex items-start gap-2 mb-2">
                  {testCase.candidateStatus === 'pass' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-[#10B981]">PASS</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-[#EF4444]">FAIL</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-900">{testCase.candidateOutput}</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Baseline Latency</p>
                  <p className="text-sm font-medium text-gray-900">980ms</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Candidate Latency</p>
                  <p className="text-sm font-medium text-gray-900">1,220ms</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Baseline Cost</p>
                  <p className="text-sm font-medium text-gray-900">$0.052</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Candidate Cost</p>
                  <p className="text-sm font-medium text-gray-900">$0.048</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          {isRegression && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[#EF4444] mb-1">Regression Detected</h4>
                  <p className="text-sm text-gray-700">
                    This test case was passing in the baseline but is now failing in the candidate version. 
                    Review the prompt changes and consider reverting or adjusting the modifications.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isImprovement && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[#10B981] mb-1">Improvement Detected</h4>
                  <p className="text-sm text-gray-700">
                    This test case was failing in the baseline but is now passing in the candidate version. 
                    This represents a positive improvement in model behavior.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            Close
          </button>
          {isRegression && (
            <button className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#d97706] transition-colors text-sm font-medium">
              Mark as Known Issue
            </button>
          )}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            View in Test Suite
          </button>
        </div>
      </div>
    </div>
  );
}
