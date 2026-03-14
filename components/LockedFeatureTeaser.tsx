import { useLanguage } from '@/components/providers/LanguageProvider'

import { Lock, Crown } from 'lucide-react'

// Premium Badge Component
export function PremiumBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | undefined }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-full ${sizes[size]} shadow-lg`}>
      <Crown className="h-3 w-3" />
      PRIME
    </span>
  )
}

// Locked Feature Teaser Component
export function LockedFeatureTeaser({
  title,
  description,
  icon: Icon,
  previewContent,
  stats,
  onUpgrade,
}: {
  title: string
  description: string
  icon: React.ElementType
  previewContent?: React.ReactNode | undefined
  stats?: { label: string; value: string }[] | undefined
  onUpgrade?: (() => void) | undefined
}) {
  const { t } = useLanguage()
  const pt = t.premium

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      {/* Premium badge */}
      <div className="absolute top-4 right-4">
        <PremiumBadge size="sm" />
      </div>

      {/* Icon and title */}
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-amber-100 rounded-xl">
          <Icon className="h-8 w-8 text-amber-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {title}
            <Lock className="h-4 w-4 text-amber-500" />
          </h3>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
      </div>

      {/* Blurred preview */}
      {previewContent && (
        <div className="relative mb-4">
          <div className="blur-sm opacity-60 pointer-events-none">
            {previewContent}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white/80 to-transparent">
            <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">{pt.unlockWithPrime}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/60 rounded-xl p-3 border border-amber-100">
              <div className="text-2xl font-bold text-amber-600">{stat.value}</div>
              <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onUpgrade}
        className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold hover:from-amber-500 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
      >
        <Crown className="h-5 w-5" />
        {pt.upgradeToPrime}
      </button>
    </div>
  )
}
