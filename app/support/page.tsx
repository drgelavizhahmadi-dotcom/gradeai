'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  Book, 
  ArrowLeft,
  Send,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function SupportPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setSubmitting(false)
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
    
    // Reset success message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
            <div className="rounded-lg bg-purple-100 p-3">
              <HelpCircle className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Support Center</h1>
          </div>
          <p className="text-lg text-gray-600">We're here to help you get the most out of GradeAI</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Support</h2>
            
            {submitted && (
              <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Message sent successfully!</p>
                  <p className="text-sm text-green-700">We'll get back to you within 24 hours.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select a topic...</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing Question</option>
                  <option value="feature">Feature Request</option>
                  <option value="data">Data Privacy Question</option>
                  <option value="account">Account Management</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  placeholder="Please describe your issue or question in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Support Resources */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Contact</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Email Support</p>
                    <a href="mailto:support@gradeai.com" className="text-blue-600 hover:text-blue-700">
                      support@gradeai.com
                    </a>
                    <p className="text-sm text-gray-600 mt-1">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Live Chat</p>
                    <p className="text-gray-600">Available Mon-Fri, 9 AM - 6 PM CET</p>
                    <button className="text-green-600 hover:text-green-700 font-semibold mt-1">
                      Start Chat →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-gray-900 font-semibold hover:text-blue-600">
                    How accurate is the AI grade detection?
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-2 ml-4">
                    Our AI uses multiple models (Claude, Gemini, Mistral) to achieve consensus-based accuracy. 
                    Typical accuracy is 90-95%, but we recommend verifying important grades manually.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-gray-900 font-semibold hover:text-blue-600">
                    Is my child's data safe and private?
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-2 ml-4">
                    Yes! We are fully GDPR compliant. All data is encrypted, stored securely in the EU, and 
                    never shared with third parties. You can delete all data at any time.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-gray-900 font-semibold hover:text-blue-600">
                    What file formats are supported?
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-2 ml-4">
                    We support JPG, PNG, and PDF files. For best results, ensure images are clear and 
                    well-lit with minimal glare.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-gray-900 font-semibold hover:text-blue-600">
                    How do I delete my account?
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-2 ml-4">
                    Go to Settings → Danger Zone → Delete Account. All your data will be permanently 
                    deleted within 30 days.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-gray-900 font-semibold hover:text-blue-600">
                    Can I export my data?
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-2 ml-4">
                    Yes! Under GDPR, you have the right to data portability. Contact us at privacy@gradeai.com 
                    to request your data in a structured format.
                  </p>
                </details>
              </div>
            </div>

            {/* Documentation */}
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Book className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Documentation</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Learn how to get the most out of GradeAI with our comprehensive guides.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                    → Getting Started Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                    → Upload Best Practices
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                    → Understanding AI Analysis
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                    → Data Privacy & GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Link
            href="/terms"
            className="rounded-xl bg-white shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Terms of Service</h3>
            <p className="text-gray-600 text-sm">
              Read our terms and conditions for using GradeAI
            </p>
          </Link>

          <Link
            href="/privacy"
            className="rounded-xl bg-white shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Privacy Policy</h3>
            <p className="text-gray-600 text-sm">
              Learn how we protect and handle your data
            </p>
          </Link>

          <div className="rounded-xl bg-white shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Report a Bug</h3>
            <p className="text-gray-600 text-sm mb-3">
              Found an issue? Let us know!
            </p>
            <a href="mailto:bugs@gradeai.com" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              bugs@gradeai.com →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
