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
  const [success, setSuccess] = useState(false)
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <OwlMascot mood="celebrating" size="lg" message="Fast geschafft!" />
          </div>
          <div className="card-story p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[var(--gray-800)] mb-4">Überprüfe deine E-Mails</h1>
            <p className="text-[var(--gray-600)] mb-6">
              Wir haben einen Bestätigungslink an <strong>{formData.email}</strong> gesendet.
              Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
            </p>
            <Link href="/login" className="btn-primary w-full inline-block">
              Zurück zum Login
            </Link>
          </div>
        </div>
      </div>
    )
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

          {/* Divider - or */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--gray-200)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[var(--gray-500)] font-medium">or</span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-[var(--gray-200)] rounded-xl bg-white hover:bg-[var(--gray-50)] transition-colors font-medium text-[var(--gray-700)] disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          {/* Divider - Already have an account? */}
          <div className="relative my-6">
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
