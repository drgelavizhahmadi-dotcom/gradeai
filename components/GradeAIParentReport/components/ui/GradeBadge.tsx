'use client'

import { useLanguage } from '../../LanguageContext'

interface GradeBadgeProps {
  grade: string
  percentage: number
  size?: 'small' | 'medium' | 'large'
}

export default function GradeBadge({ grade, percentage, size = 'large' }: GradeBadgeProps) {
  const { isRTL } = useLanguage()
  
  // Color coding based on grade/percentage
  const getGradeColor = () => {
    if (percentage >= 70) return 'from-emerald-500 to-green-600'
    if (percentage >= 50) return 'from-amber-500 to-yellow-600'
    if (percentage >= 30) return 'from-orange-500 to-orange-600'
    return 'from-red-500 to-red-600'
  }

  const sizeClasses = {
    small: 'w-16 h-16 text-xl',
    medium: 'w-20 h-20 text-2xl',
    large: 'w-24 h-24 text-3xl'
  }

  return (
    <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${getGradeColor()} shadow-lg flex flex-col items-center justify-center text-white font-bold`}>
      <div className={isRTL ? 'font-arabic' : ''}>{grade}</div>
      <div className="text-xs font-normal opacity-90">{percentage}%</div>
    </div>
  )
}
