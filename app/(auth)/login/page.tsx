'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react'
import { OwlMascot } from '@/components/mascots'
import { usePreLoginTranslation } from '@/lib/preLoginTranslations'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language, setLanguage } = usePreLoginTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t.login.errorInvalidCredentials)
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError(t.login.errorUnexpected)
      setIsLoading(false)
    }
  }

  return (
    <div dir="ltr" className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-1 py-1 shadow-lg border border-[var(--gray-200)]">
          <button
            onClick={() => setLanguage('de')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${language === 'de'
              ? 'bg-[var(--primary)] text-white shadow-md'
              : 'text-[var(--gray-600)] hover:text-[var(--gray-800)]'
              }`}
          >
            DE
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${language === 'en'
              ? 'bg-[var(--primary)] text-white shadow-md'
              : 'text-[var(--gray-600)] hover:text-[var(--gray-800)]'
              }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Logo/Header with Mascot */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <OwlMascot mood="happy" size="lg" message={t.login.mascotMessage} />
          </div>
          <h1 className="text-3xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {t.login.title}
          </h1>
          <p className="text-[var(--gray-600)]">{t.login.subtitle}</p>
        </div>

        {/* Login Form */}
        <div className="card-story p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-[var(--coral)]/10 border-2 border-[var(--coral)]/30 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--coral)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--coral)] font-medium">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {t.login.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {t.login.passwordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white"
                  placeholder={t.login.passwordPlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] hover:underline"
              >
                {t.login.forgotPassword}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.login.loggingIn}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t.login.loginButton}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--gray-200)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[var(--gray-500)] font-medium">{t.login.noAccount}</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/signup"
            className="btn-secondary w-full block text-center"
          >
            {t.login.createAccount}
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[var(--gray-600)]">
          {t.login.footerText}{' '}
          <Link href="/terms" className="text-[var(--primary)] hover:underline font-medium">
            {t.login.termsOfService}
          </Link>{' '}
          {t.login.footerAnd}{' '}
          <Link href="/privacy" className="text-[var(--primary)] hover:underline font-medium">
            {t.login.privacyPolicy}
          </Link>
          {t.login.footerEnd && ` ${t.login.footerEnd}`}
        </p>
      </div>
    </div>
  )
}
