'use client'

import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function TermsPage() {
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
            <div className="rounded-lg bg-blue-100 p-3">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-gray-600">Last updated: January 20, 2026</p>
        </div>

        {/* Content */}
        <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using GradeAI ("the Service"), you accept and agree to be bound by the terms and 
              provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              GradeAI provides an AI-powered test analysis platform that helps parents and educators analyze academic 
              test results. Our service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Upload and storage of test images and documents</li>
              <li>AI-powered optical character recognition (OCR)</li>
              <li>Automated grade detection and analysis</li>
              <li>Performance tracking and insights</li>
              <li>Multi-language support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use GradeAI, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Not use another user's account without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Upload content that is illegal, harmful, threatening, abusive, or otherwise objectionable</li>
              <li>Violate any intellectual property rights</li>
              <li>Transmit any viruses, malware, or other malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use the Service for any automated or systematic data collection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Privacy and GDPR Compliance</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We are committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>We process personal data lawfully, fairly, and transparently</li>
              <li>Data is collected only for specified, explicit, and legitimate purposes</li>
              <li>You have the right to access, rectify, or erase your personal data</li>
              <li>You have the right to data portability</li>
              <li>You may withdraw consent at any time</li>
              <li>All data is encrypted and stored securely</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              For more information, please see our <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service and its original content, features, and functionality are owned by GradeAI and are protected 
              by international copyright, trademark, patent, trade secret, and other intellectual property laws. You 
              retain ownership of content you upload, but grant us a license to use it to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. AI Analysis Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              While we use advanced AI technology to analyze tests, our analysis is provided for informational purposes 
              only. The AI may make errors in grade detection or analysis. We do not guarantee the accuracy of AI-generated 
              results and recommend verifying important information independently.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              GradeAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
              resulting from your use or inability to use the Service. Our total liability shall not exceed the amount 
              you paid for the Service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Service Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or discontinue the Service at any time, with or without notice. We shall 
              not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for 
              any breach of these Terms. Upon termination, your right to use the Service will immediately cease. You may 
              also delete your account at any time through the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of Germany, without regard to 
              its conflict of law provisions. Any disputes shall be resolved in the courts of Germany.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes via 
              email or through the Service. Your continued use of the Service after such modifications constitutes 
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@gradeai.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                legal@gradeai.com
              </a>
            </p>
          </section>

          <section className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600">
              By using GradeAI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
