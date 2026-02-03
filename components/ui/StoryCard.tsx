'use client'

import { ReactNode } from 'react'

interface StoryCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'highlighted' | 'success' | 'warning'
}

export function StoryCard({
  children,
  className = '',
  hover = true,
  padding = 'md',
  variant = 'default'
}: StoryCardProps) {
  const paddingMap = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const variantStyles = {
    default: 'bg-white border-[var(--gray-200)]',
    highlighted: 'bg-[var(--primary-soft)] border-[var(--primary-light)]',
    success: 'bg-[var(--success-soft)] border-[var(--success-light)]',
    warning: 'bg-[var(--warning-soft)] border-[var(--warning)]'
  }

  return (
    <div
      className={`
        rounded-2xl border shadow-[var(--shadow-md)] transition-all duration-300
        ${paddingMap[padding]}
        ${variantStyles[variant]}
        ${hover ? 'hover:shadow-[var(--shadow-lg)] hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Section header with optional icon
interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}

export function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--gray-500)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Divider with optional text
interface StoryDividerProps {
  text?: string
  className?: string
}

export function StoryDivider({ text, className = '' }: StoryDividerProps) {
  if (!text) {
    return (
      <div className={`h-px bg-gradient-to-r from-transparent via-[var(--gray-300)] to-transparent my-6 ${className}`} />
    )
  }

  return (
    <div className={`divider-story my-6 text-sm ${className}`}>
      {text}
    </div>
  )
}

export default StoryCard
