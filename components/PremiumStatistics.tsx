import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { getPremiumTranslation } from './premiumTranslations'

export const FOMO_STATS = {
  upgradesThisWeek: 347,
  parentsSatisfied: 94,
  avgGradeImprovement: 0.8,
  flashcardsGenerated: 12847,
  fairnessChecksRun: 8293,
  learningMaterialsGenerated: 5621,
}

export function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number | undefined; suffix?: string | undefined }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{count.toLocaleString()}{suffix}</span>
}

export function PremiumStatistics() {
  const { language: globalLang } = useLanguage()
  const pt = getPremiumTranslation(globalLang)

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 border-2 border-white" />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          +<AnimatedCounter end={FOMO_STATS.upgradesThisWeek} /> {pt.thisWeekStat}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {FOMO_STATS.parentsSatisfied}% {pt.satisfiedParents}
        </span>
      </div>
    </div>
  )
}
