'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, User, Phone, Globe, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { OwlMascot } from '@/components/mascots'
import { usePreLoginTranslation } from '@/lib/preLoginTranslations'

export default function SignUpPage() {
  const router = useRouter()
  const { t, language, setLanguage } = usePreLoginTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    language: 'de',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t.signup.errorPasswordMismatch)
      return
    }

    if (formData.password.length < 8) {
      setError(t.signup.errorPasswordLength)
      return
    }

    setIsLoading(true)

    try {
      // Create user account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          language: formData.language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t.signup.errorUnexpected)
        setIsLoading(false)
        return
      }

      // Auto-login after successful signup
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError(t.signup.errorAccountCreatedLoginFailed)
        setIsLoading(false)
        return
      }

      if (signInResult?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError(t.signup.errorUnexpected)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
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
            <OwlMascot mood="celebrating" size="lg" message={t.signup.mascotMessage} />
          </div>
          <h1 className="text-3xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {t.signup.title}
          </h1>
          <p className="text-[var(--gray-600)]">{t.signup.subtitle}</p>
        </div>

        {/* Signup Form */}
        <div className="card-story p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-[var(--coral)]/10 border-2 border-[var(--coral)]/30 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--coral)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--coral)] font-medium">{error}</p>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {t.signup.nameLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white"
                  placeholder={t.signup.namePlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {t.signup.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {t.signup.phoneLabel} <span className="text-[var(--gray-400)] font-normal">{t.signup.phoneOptional}</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white"
                  placeholder="+49 123 456789"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Language Dropdown */}
            <div>
              <label htmlFor="language" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {t.signup.languageLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors appearance-none bg-white"
                  disabled={isLoading}
                >
                  <option value="de">German (Deutsch)</option>
                  <option value="en">English</option>
                  <option value="fr">French (Français)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="it">Italian (Italiano)</option>
                </select>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {t.signup.passwordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white"
                  placeholder={t.signup.passwordPlaceholder}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                {t.signup.confirmPasswordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CheckCircle className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white"
                  placeholder={t.signup.confirmPasswordPlaceholder}
                  disabled={isLoading}
                />
              </div>
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
                  {t.signup.submitting}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t.signup.submitButton}
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
              <span className="px-4 bg-white text-[var(--gray-500)] font-medium">{t.signup.hasAccount}</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/login"
            className="btn-secondary w-full block text-center"
          >
            {t.signup.signIn}
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-[var(--gray-600)]">
          {t.signup.footerText}{' '}
          <Link href="/terms" className="text-[var(--primary)] hover:underline font-medium">
            {t.signup.termsOfService}
          </Link>{' '}
          {t.signup.footerAnd}{' '}
          <Link href="/privacy" className="text-[var(--primary)] hover:underline font-medium">
            {t.signup.privacyPolicy}
          </Link>
          {t.signup.footerEnd && ` ${t.signup.footerEnd}`}
        </p>
      </div>
    </div>
  )
}
