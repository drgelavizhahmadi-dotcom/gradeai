'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { OwlMascot } from '@/components/mascots'

function ResetPasswordContent() {
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
            setError('Ungültiger oder fehlender Token.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwörter stimmen nicht überein.')
            return
        }

        if (password.length < 8) {
            setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
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
                setError(data.error || 'Zurücksetzen fehlgeschlagen.')
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
            setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
                <div className="w-full max-w-md text-center">
                    <OwlMascot mood="thinking" size="lg" message="Oje..." />
                    <div className="card-story p-8 mt-6">
                        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-[var(--gray-800)] mb-4">Ungültiger Link</h1>
                        <p className="text-[var(--gray-600)] mb-6">
                            Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
                        </p>
                        <Link href="/forgot-password" className="btn-primary w-full inline-block">
                            Neuen Link anfordern
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <OwlMascot mood={success ? 'happy' : 'thinking'} size="lg" message={success ? "Fertig!" : "Neues Passwort"} />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        Passwort zurücksetzen
                    </h1>
                    <p className="text-[var(--gray-600)]">Gib jetzt dein neues Passwort ein.</p>
                </div>

                <div className="card-story p-8">
                    {success ? (
                        <div className="text-center">
                            <div className="bg-green-100 p-3 rounded-full inline-block mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--gray-800)] mb-2">Erfolgreich!</h2>
                            <p className="text-[var(--gray-600)] mb-6">
                                Dein Passwort wurde erfolgreich geändert. Du wirst nun zum Login weitergeleitet.
                            </p>
                            <Link href="/login" className="btn-primary w-full inline-block">
                                Jetzt anmelden
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
                                    Neues Passwort
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
                                        placeholder="Mindestens 8 Zeichen"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[var(--gray-700)] mb-2">
                                    Passwort bestätigen
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
                                        placeholder="Passwort erneut eingeben"
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
                                        Wird gespeichert...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Passwort speichern
                                    </>
                                )}
                            </button>
                        </form>
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
