'use client'

import Link from 'next/link'
import { Lock, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function PrivacyPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.common?.back || 'Back to Dashboard'}
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-lg bg-green-100 p-3">
              <Lock className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600">Last updated: January 20, 2026</p>
        </div>

        {/* Content */}
        <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              GradeAI ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how 
              we collect, use, disclose, and safeguard your information when you use our AI-powered test analysis service. 
              This policy is designed to comply with the General Data Protection Regulation (GDPR) and other applicable 
              data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Controller</h2>
            <p className="text-gray-700 leading-relaxed">
              GradeAI, operating under the legal entity [Company Name], is the data controller responsible for your 
              personal data. You can contact our Data Protection Officer at{' '}
              <a href="mailto:privacy@gradeai.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                privacy@gradeai.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Password (encrypted)</li>
              <li>Account creation date</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Children's Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may choose to provide information about your children:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Child's name (first name only recommended)</li>
              <li>Grade level</li>
              <li>School type</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 Test Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you upload tests for analysis:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Test images or PDF files</li>
              <li>Extracted text from OCR processing</li>
              <li>Detected grades and scores</li>
              <li>AI-generated analysis results</li>
              <li>Upload timestamps</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.4 Usage Data</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Browser type and version</li>
              <li>IP address (anonymized)</li>
              <li>Pages visited and time spent</li>
              <li>Device information</li>
              <li>Language preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Legal Basis for Processing (GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Consent:</strong> You have given explicit consent for processing your data</li>
              <li><strong>Contract:</strong> Processing is necessary to provide our services</li>
              <li><strong>Legal Obligation:</strong> We must comply with legal requirements</li>
              <li><strong>Legitimate Interest:</strong> To improve our services and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide and maintain our AI analysis services</li>
              <li>Process and analyze uploaded test documents</li>
              <li>Track academic progress over time</li>
              <li>Send service-related notifications</li>
              <li>Improve our AI models and algorithms</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
              <li>Respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement robust security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>End-to-end encryption for data transmission (TLS/SSL)</li>
              <li>Encrypted storage of sensitive data</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure database hosting with PostgreSQL</li>
              <li>Regular automated backups</li>
              <li>Staff training on data protection</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Data is stored on secure servers within the European Union to ensure GDPR compliance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal data only as long as necessary for the purposes outlined in this policy. 
              Test data and analysis results are kept for the duration of your account. When you delete your account, 
              all associated data is permanently deleted within 30 days, except where we are required by law to retain 
              certain information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>AI Providers:</strong> Claude (Anthropic), Gemini (Google), Mistral, DeepSeek for test analysis</li>
              <li><strong>Cloud Storage:</strong> Vercel Blob for file storage</li>
              <li><strong>Authentication:</strong> NextAuth.js for secure authentication</li>
              <li><strong>Hosting:</strong> Vercel for application hosting</li>
              <li><strong>Database:</strong> Neon (PostgreSQL) for data storage</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              These services are GDPR-compliant and process data according to their own privacy policies. We have 
              data processing agreements in place with all third-party processors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Your Rights Under GDPR</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Right to Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of data processing</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with a supervisory authority</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:privacy@gradeai.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                privacy@gradeai.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use essential cookies to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Maintain your session and authentication</li>
              <li>Remember your language preference</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We do not use third-party tracking cookies or advertising cookies. You can control cookies through your 
              browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data is primarily stored and processed within the European Union. If we transfer data outside the 
              EU, we ensure adequate safeguards are in place, such as Standard Contractual Clauses (SCCs) approved by 
              the European Commission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is intended for use by parents and guardians. We do not knowingly collect personal information 
              directly from children under 16. Parents have full control over their children's data through their account 
              and can delete it at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Data Breach Notification</h2>
            <p className="text-gray-700 leading-relaxed">
              In the event of a data breach that poses a risk to your rights and freedoms, we will notify you and the 
              relevant supervisory authority within 72 hours of becoming aware of the breach, as required by GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by email 
              or through a prominent notice on our service. Your continued use after such changes constitutes acceptance 
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 font-semibold">Data Protection Officer</p>
              <p className="text-gray-700">GradeAI</p>
              <p className="text-gray-700">Email:{' '}
                <a href="mailto:privacy@gradeai.com" className="text-blue-600 hover:text-blue-700">
                  privacy@gradeai.com
                </a>
              </p>
              <p className="text-gray-700 mt-2">
                Supervisory Authority: Your local data protection authority (for EU residents)
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
