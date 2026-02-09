import { X, Shield } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Privacy Policy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-600 mb-6">Last updated: February 9, 2026</p>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h3>
              <p className="text-gray-700 mb-4">
                Welcome to Sentinel. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you about how we look after your personal data when you use our 
                platform and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Data We Collect</h3>
              <p className="text-gray-700 mb-4">
                We collect and process the following types of data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Account Information:</strong> Name, email address, company name</li>
                <li><strong>Usage Data:</strong> Test cases, model outputs, performance metrics</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                <li><strong>Communication Data:</strong> Support tickets, feedback, correspondence</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3. How We Use Your Data</h3>
              <p className="text-gray-700 mb-4">
                We use your data for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Provide and maintain our service</li>
                <li>Process test runs and generate reports</li>
                <li>Send you notifications and alerts</li>
                <li>Improve our platform and develop new features</li>
                <li>Provide customer support</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h3>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>End-to-end encryption for data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>SOC 2 Type II compliance</li>
                <li>Role-based access controls</li>
                <li>Multi-factor authentication</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Data Retention</h3>
              <p className="text-gray-700 mb-4">
                We retain your data only for as long as necessary:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Account data: Until account deletion or 90 days after inactivity</li>
                <li>Test results: 2 years or until manual deletion</li>
                <li>Logs and analytics: 1 year</li>
                <li>Support tickets: 3 years</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Data Sharing</h3>
              <p className="text-gray-700 mb-4">
                We do not sell your personal data. We may share data with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Service providers (cloud hosting, analytics) under strict confidentiality</li>
                <li>Law enforcement when required by law</li>
                <li>Third parties with your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Your Rights</h3>
              <p className="text-gray-700 mb-4">
                You have the following rights regarding your data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Objection:</strong> Object to processing of your data</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies</h3>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li>Keep you signed in</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage</li>
                <li>Improve user experience</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookies through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">9. International Transfers</h3>
              <p className="text-gray-700 mb-4">
                Your data may be processed in countries outside your residence. We ensure appropriate 
                safeguards are in place, including Standard Contractual Clauses approved by the European Commission.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Children's Privacy</h3>
              <p className="text-gray-700 mb-4">
                Our service is not intended for children under 16. We do not knowingly collect data from children.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Changes to This Policy</h3>
              <p className="text-gray-700 mb-4">
                We may update this privacy policy from time to time. We will notify you of any changes by 
                posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">12. Contact Us</h3>
              <p className="text-gray-700 mb-4">
                If you have questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-1"><strong>Email:</strong> privacy@sentinel.io</p>
                <p className="text-sm text-gray-700 mb-1"><strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105</p>
                <p className="text-sm text-gray-700"><strong>Data Protection Officer:</strong> dpo@sentinel.io</p>
              </div>
            </section>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>GDPR & CCPA Compliance:</strong> Sentinel is fully compliant with GDPR, CCPA, and other 
                major privacy regulations. We are committed to protecting your privacy rights.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
