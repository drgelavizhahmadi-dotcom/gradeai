'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { OwlMascot } from '@/components/mascots'
import { usePreLoginTranslation } from '@/lib/preLoginTranslations'

function ResetPasswordContent() {
    const { t, language, setLanguage } = usePreLoginTranslation()
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!token) {
            setError(t.resetPassword.errorUnexpected)
            return
        }

        if (password !== confirmPassword) {
            setError(t.resetPassword.errorMismatch)
            return
        }

        if (password.length < 8) {
            setError(t.resetPassword.errorLength)
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || t.resetPassword.errorUnexpected)
                setIsLoading(false)
                return
            }

            setSuccess(true)
            setIsLoading(false)
            // Redirect after 3 seconds
            setTimeout(() => {
                router.push('/login')
            }, 3000)
        } catch (err) {
            setError(t.resetPassword.errorUnexpected)
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
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <OwlMascot
                            mood={success ? 'happy' : (token ? 'thinking' : 'thinking')}
                            size="lg"
                            message={success ? t.resetPassword.mascotMessageSuccess : (token ? t.resetPassword.mascotMessage : t.resetPassword.mascotMessageError)}
                        />
                    </div>
                    {!token ? (
                        <>
                            <div className="card-story p-8">
                                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                                <h1 className="text-2xl font-bold text-[var(--gray-800)] mb-4">{t.resetPassword.invalidTitle}</h1>
                                <p className="text-[var(--gray-600)] mb-6">
                                    {t.resetPassword.invalidDesc}
                                </p>
                                <Link href="/forgot-password" className="btn-primary w-full inline-block">
                                    {t.resetPassword.invalidButton}
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                {t.resetPassword.title}
                            </h1>
                            <p className="text-[var(--gray-600)]">{t.resetPassword.subtitle}</p>

                            <div className="card-story p-8 mt-8">
                                {success ? (
                                    <div className="text-center">
                                        <div className="bg-green-100 p-3 rounded-full inline-block mb-4">
                                            <CheckCircle className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-[var(--gray-800)] mb-2">{t.resetPassword.successTitle}</h2>
                                        <p className="text-[var(--gray-600)] mb-6">
                                            {t.resetPassword.successDesc}
                                        </p>
                                        <Link href="/login" className="btn-primary w-full inline-block">
                                            {t.resetPassword.successButton}
                                        </Link>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {error && (
                                            <div className="rounded-xl bg-[var(--coral)]/10 border-2 border-[var(--coral)]/30 p-4 flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-[var(--coral)] flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-[var(--coral)] font-medium">{error}</p>
                                            </div>
                                        )}

                                        <div>
                                            <label htmlFor="password" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                                                {t.resetPassword.passwordLabel}
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
                                                    placeholder={t.resetPassword.passwordPlaceholder}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                                                {t.resetPassword.confirmPasswordLabel}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Lock className="h-5 w-5 text-[var(--gray-400)]" />
                                                </div>
                                                <input
                                                    id="confirmPassword"
                                                    type="password"
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="block w-full pl-12 pr-4 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white"
                                                    placeholder={t.resetPassword.confirmPasswordPlaceholder}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    {t.resetPassword.submitting}
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    {t.resetPassword.submitButton}
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
