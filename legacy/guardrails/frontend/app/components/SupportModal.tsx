import { X, Mail, MessageCircle, Phone, FileText, Send } from 'lucide-react';
"use client";

import { useState } from 'react';

interface SupportModalProps {
  onClose: () => void;
}

export function SupportModal({ onClose }: SupportModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Support request submitted! Our team will get back to you within 24 hours.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Support Center</h2>
            <p className="text-sm text-blue-100 mt-1">We're here to help you</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Options */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Get in Touch</h3>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Email Support</h4>
                      <p className="text-sm text-gray-600 mb-2">Get help via email within 24 hours</p>
                      <a href="mailto:support@sentinel.io" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        support@sentinel.io
                      </a>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Live Chat</h4>
                      <p className="text-sm text-gray-600 mb-2">Chat with our support team now</p>
                      <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                        Start Chat →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Phone Support</h4>
                      <p className="text-sm text-gray-600 mb-2">Speak directly with our team</p>
                      <a href="tel:+1-555-0123" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                        +1 (555) 0123-4567
                      </a>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Documentation</h4>
                      <p className="text-sm text-gray-600 mb-2">Browse our knowledge base</p>
                      <button className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                        View Docs →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  <details className="border border-gray-200 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">How do I create test cases?</summary>
                    <p className="text-sm text-gray-600 mt-2">
                      You can create test cases through the dashboard or via our API. Check the documentation for detailed examples.
                    </p>
                  </details>
                  <details className="border border-gray-200 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">What's included in my plan?</summary>
                    <p className="text-sm text-gray-600 mt-2">
                      Your plan includes unlimited test runs, 24/7 monitoring, and email support. Premium plans include phone support.
                    </p>
                  </details>
                  <details className="border border-gray-200 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">How do I upgrade my account?</summary>
                    <p className="text-sm text-gray-600 mt-2">
                      Visit the Billing section in Settings to view available plans and upgrade options.
                    </p>
                  </details>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit a Request</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General Question</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details about your request..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={8}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Send className="w-4 h-4" />
                  Submit Request
                </button>

                <p className="text-xs text-gray-600 text-center">
                  We typically respond within 24 hours during business days
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
