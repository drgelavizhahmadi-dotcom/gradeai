'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { OwlMascot } from '@/components/mascots'

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Wir verifizieren deine E-Mail-Adresse...')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Kein Verifizierungstoken gefunden.')
            return
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                })

                const data = await response.json()

                if (response.ok) {
                    setStatus('success')
                    setMessage('Deine E-Mail-Adresse wurde erfolgreich verifiziert!')
                    // Auto redirect after 3 seconds
                    setTimeout(() => {
                        router.push('/login?verified=true')
                    }, 3000)
                } else {
                    setStatus('error')
                    setMessage(data.error || 'Verifizierung fehlgeschlagen.')
                }
            } catch (error) {
                setStatus('error')
                setMessage('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.')
            }
        }

        verifyEmail()
    }, [token, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
            <div className="w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <OwlMascot
                        mood={status === 'success' ? 'happy' : 'thinking'}
                        size="lg"
                        showMessage={false}
                    />
                </div>

                <div className="card-story p-8">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin mb-4" />
                            <h1 className="text-xl font-bold text-[var(--gray-800)]">{message}</h1>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <div className="bg-green-100 p-3 rounded-full mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-[var(--gray-800)] mb-4">Verifiziert!</h1>
                            <p className="text-[var(--gray-600)] mb-6">{message}</p>
                            <p className="text-sm text-[var(--gray-500)] mb-4">Du wirst in Kürze zum Login weitergeleitet...</p>
                            <Link href="/login" className="btn-primary w-full">
                                Jetzt anmelden
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="bg-red-100 p-3 rounded-full mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-[var(--gray-800)] mb-4">Hoppla!</h1>
                            <p className="text-[var(--gray-600)] mb-6">{message}</p>
                            <Link href="/signup" className="btn-primary w-full mb-3">
                                Erneut registrieren
                            </Link>
                            <Link href="/login" className="text-sm font-medium text-[var(--primary)] hover:underline">
                                Zum Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
