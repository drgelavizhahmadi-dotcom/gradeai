'use client'

import { useState, useMemo } from 'react'
import { Eye, EyeOff, Check, X, Lock } from 'lucide-react'

interface PasswordInputProps {
    id: string
    name?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    required?: boolean
    disabled?: boolean
    label?: string
    error?: string
    showComplexity?: boolean
    translations: {
        strengthLabel: string
        strengthWeak: string
        strengthMedium: string
        strengthStrong: string
        ruleLength: string
        ruleNumber: string
        ruleUppercase: string
        ruleSpecial: string
    }
}

export function PasswordInput({
    id,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    disabled = false,
    label,
    error,
    showComplexity = false,
    translations,
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false)

    const toggleVisibility = () => setShowPassword(!showPassword)

    const complexity = useMemo(() => {
        if (!showComplexity || !value) return null

        const checks = [
            { label: translations.ruleLength, met: value.length >= 8 },
            { label: translations.ruleNumber, met: /\d/.test(value) },
            { label: translations.ruleUppercase, met: /[A-Z]/.test(value) },
            { label: translations.ruleSpecial, met: /[^A-Za-z0-9]/.test(value) },
        ]

        const score = checks.filter(c => c.met).length
        let strength = translations.strengthWeak
        let color = 'bg-red-500'

        if (score === 4) {
            strength = translations.strengthStrong
            color = 'bg-green-500'
        } else if (score >= 2) {
            strength = translations.strengthMedium
            color = 'bg-yellow-500'
        }

        return { checks, score, strength, color }
    }, [value, showComplexity, translations])

    return (
        <div className="space-y-2">
            {label && (
                <label htmlFor={id} className="block text-sm font-semibold text-[var(--gray-700)]">
                    {label}
                </label>
            )}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[var(--gray-400)]" />
                </div>
                <input
                    id={id}
                    name={name || id}
                    type={showPassword ? 'text' : 'password'}
                    required={required}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    autoComplete="current-password"
                    className={`block w-full pl-12 pr-12 py-3 border-2 border-[var(--gray-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-colors bg-white ${error ? 'border-red-500' : ''
                        }`}
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={toggleVisibility}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--gray-400)] hover:text-[var(--gray-600)]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>

            {showComplexity && value && complexity && (
                <div className="mt-3 space-y-3 p-4 bg-[var(--gray-50)] rounded-xl border border-[var(--gray-200)]">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--gray-500)]">
                            {translations.strengthLabel}: <span className={complexity.score === 4 ? 'text-green-600' : complexity.score >= 2 ? 'text-yellow-600' : 'text-red-600'}>{complexity.strength}</span>
                        </span>
                    </div>

                    <div className="h-1.5 w-full bg-[var(--gray-200)] rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${complexity.color}`}
                            style={{ width: `${(complexity.score / 4) * 100}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {complexity.checks.map((check, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {check.met ? (
                                    <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                    <X className="h-3.5 w-3.5 text-[var(--gray-300)]" />
                                )}
                                <span className={`text-xs ${check.met ? 'text-[var(--gray-700)]' : 'text-[var(--gray-400)]'}`}>
                                    {check.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
