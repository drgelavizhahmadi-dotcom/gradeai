'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'coral' | 'gold' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
  `

  const variantStyles = {
    primary: `
      bg-[var(--primary)] text-white
      hover:bg-[var(--primary-dark)] hover:-translate-y-0.5 hover:shadow-lg
      focus-visible:ring-[var(--primary)]
      active:translate-y-0
    `,
    secondary: `
      bg-white text-[var(--gray-700)] border-2 border-[var(--gray-200)]
      hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5
      focus-visible:ring-[var(--primary)]
    `,
    coral: `
      bg-[var(--coral)] text-white
      hover:bg-[var(--coral-dark)] hover:-translate-y-0.5 hover:shadow-lg
      focus-visible:ring-[var(--coral)]
    `,
    gold: `
      bg-[var(--gold)] text-[var(--gray-800)]
      hover:bg-[var(--gold-dark)] hover:-translate-y-0.5 hover:shadow-lg
      focus-visible:ring-[var(--gold)]
    `,
    ghost: `
      bg-transparent text-[var(--gray-600)]
      hover:bg-[var(--gray-100)] hover:text-[var(--gray-800)]
      focus-visible:ring-[var(--gray-400)]
    `,
    danger: `
      bg-[var(--error)] text-white
      hover:bg-[var(--error)] hover:brightness-90 hover:-translate-y-0.5
      focus-visible:ring-[var(--error)]
    `
  }

  const sizeStyles = {
    sm: 'text-sm px-3 py-2',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3'
  }

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{ fontFamily: 'var(--font-display)' }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  )
}

// Icon-only button
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  label: string // For accessibility
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  label,
  className = '',
  ...props
}: IconButtonProps) {
  const variantStyles = {
    primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]',
    secondary: 'bg-white text-[var(--gray-600)] border border-[var(--gray-200)] hover:border-[var(--primary)] hover:text-[var(--primary)]',
    ghost: 'text-[var(--gray-500)] hover:bg-[var(--gray-100)] hover:text-[var(--gray-700)]',
    danger: 'text-[var(--error)] hover:bg-[var(--error-soft)]'
  }

  const sizeStyles = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg transition-all
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      aria-label={label}
      {...props}
    >
      {icon}
    </button>
  )
}

export default Button
