'use client'

interface GradeBadgeProps {
  grade: number | string | null | undefined
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
}

const gradeLabels: Record<number, string> = {
  1: 'Excellent',
  2: 'Good',
  3: 'Satisfactory',
  4: 'Adequate',
  5: 'Poor',
  6: 'Very Poor'
}

const gradeLabelsDe: Record<number, string> = {
  1: 'Sehr gut',
  2: 'Gut',
  3: 'Befriedigend',
  4: 'Ausreichend',
  5: 'Mangelhaft',
  6: 'Ungenügend'
}

export function GradeBadge({
  grade,
  size = 'md',
  showLabel = false,
  animated = false
}: GradeBadgeProps) {
  if (grade === null || grade === undefined) {
    return (
      <span className={`
        grade-badge bg-[var(--gray-200)] text-[var(--gray-600)]
        ${size === 'sm' ? 'text-xs px-2 py-1 min-w-[32px]' : ''}
        ${size === 'md' ? 'text-sm px-3 py-1.5 min-w-[40px]' : ''}
        ${size === 'lg' ? 'text-lg px-4 py-2 min-w-[56px]' : ''}
      `}>
        —
      </span>
    )
  }

  const gradeNum = typeof grade === 'string' ? parseFloat(grade) : grade
  const roundedGrade = Math.round(gradeNum)
  const gradeClass = `grade-${Math.min(6, Math.max(1, roundedGrade))}`

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 min-w-[32px]',
    md: 'text-sm px-3 py-1.5 min-w-[40px]',
    lg: 'text-lg px-4 py-2 min-w-[56px]'
  }

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span
        className={`
          grade-badge ${gradeClass} ${sizeClasses[size]}
          ${animated ? 'animate-bounce-in' : ''}
        `}
      >
        {typeof grade === 'number' ? grade.toFixed(1) : grade}
      </span>
      {showLabel && roundedGrade >= 1 && roundedGrade <= 6 && (
        <span className="text-xs text-[var(--gray-500)] font-medium">
          {gradeLabelsDe[roundedGrade]}
        </span>
      )}
    </div>
  )
}

// Grade trend indicator
interface GradeTrendProps {
  current: number
  previous: number
  size?: 'sm' | 'md'
}

export function GradeTrend({ current, previous, size = 'md' }: GradeTrendProps) {
  const diff = previous - current // Lower is better in German system
  const isImproving = diff > 0.3
  const isDeclining = diff < -0.3

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  if (isImproving) {
    return (
      <div className="inline-flex items-center gap-1 text-[var(--success)]">
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <span className="text-sm font-medium">+{diff.toFixed(1)}</span>
      </div>
    )
  }

  if (isDeclining) {
    return (
      <div className="inline-flex items-center gap-1 text-[var(--error)]">
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <span className="text-sm font-medium">{diff.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1 text-[var(--gray-500)]">
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
      <span className="text-sm font-medium">Stable</span>
    </div>
  )
}

export default GradeBadge
