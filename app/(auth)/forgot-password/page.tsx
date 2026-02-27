'use client'

import { useState } from 'react'
import { Mail, Loader2, AlertCircle, CheckCircle, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { OwlMascot } from '@/components/mascots'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'Etwas ist schief gelaufen.')
                setIsLoading(false)
                return
            }

            setSuccess(true)
            setIsLoading(false)
        } catch (err) {
            setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <OwlMascot mood={success ? 'happy' : 'thinking'} size="lg" message={success ? "E-Mail gesendet!" : "Passwort vergessen?"} />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Passwort vergessen
                    </h1>
                    <p className="text-[var(--gray-600)]">Kein Problem! Wir senden dir einen Link zum Zurücksetzen.</p>
                </div>

                <div className="card-story p-8">
                    {success ? (
                        <div className="text-center">
                            <div className="bg-green-100 p-3 rounded-full inline-block mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-[var(--gray-800)] font-medium mb-6">
                                Wenn ein Konto mit <strong>{email}</strong> existiert, haben wir dir einen Link zum Zurücksetzen deines Passworts gesendet.
                            </p>
                            <Link href="/login" className="btn-primary w-full inline-block">
                                Zurück zum Login
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
                                <label htmlFor="email" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                                    E-Mail-Adresse
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

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Wird gesendet...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Link anfordern
                                    </>
                                )}
                            </button>

                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--gray-500)] hover:text-[var(--primary)] transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Zurück zum Login
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
