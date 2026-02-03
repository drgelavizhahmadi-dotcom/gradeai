'use client'

import { OwlMascot } from './OwlMascot'
import { FoxMascot } from './FoxMascot'
import { CatMascot } from './CatMascot'

export { OwlMascot } from './OwlMascot'
export { FoxMascot } from './FoxMascot'
export { CatMascot } from './CatMascot'

export type MascotType = 'owl' | 'fox' | 'cat'
export type MascotMood = 'happy' | 'thinking' | 'celebrating' | 'encouraging' | 'sleeping'

interface MascotProps {
  type?: MascotType
  mood?: MascotMood
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  message?: string
  showMessage?: boolean
}

// Universal mascot component - renders the appropriate mascot based on type
export function Mascot({
  type = 'owl',
  mood = 'happy',
  size = 'md',
  className = '',
  message,
  showMessage = true
}: MascotProps) {
  switch (type) {
    case 'fox':
      return <FoxMascot mood={mood} size={size} className={className} message={message} showMessage={showMessage} />
    case 'cat':
      return <CatMascot mood={mood} size={size} className={className} message={message} showMessage={showMessage} />
    case 'owl':
    default:
      return <OwlMascot mood={mood} size={size} className={className} message={message} showMessage={showMessage} />
  }
}

// Mascot selector component
interface MascotSelectorProps {
  selected: MascotType
  onSelect: (type: MascotType) => void
  size?: 'sm' | 'md'
}

export function MascotSelector({ selected, onSelect, size = 'sm' }: MascotSelectorProps) {
  const mascots: MascotType[] = ['owl', 'fox', 'cat']
  const labels: Record<MascotType, string> = {
    owl: 'Uhu the Owl',
    fox: 'Felix the Fox',
    cat: 'Mila the Cat'
  }

  return (
    <div className="flex gap-4 items-center">
      {mascots.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`
            flex flex-col items-center gap-2 p-3 rounded-xl transition-all
            ${selected === type
              ? 'bg-[var(--primary-soft)] ring-2 ring-[var(--primary)] scale-105'
              : 'bg-[var(--gray-100)] hover:bg-[var(--gray-200)]'
            }
          `}
        >
          <Mascot type={type} size={size} mood="happy" showMessage={false} />
          <span className={`text-xs font-medium ${selected === type ? 'text-[var(--primary-dark)]' : 'text-[var(--gray-600)]'}`}>
            {labels[type]}
          </span>
        </button>
      ))}
    </div>
  )
}

// Celebration banner with mascot
interface CelebrationBannerProps {
  mascotType?: MascotType
  title: string
  subtitle?: string
  onClose?: () => void
}

export function CelebrationBanner({ mascotType = 'owl', title, subtitle, onClose }: CelebrationBannerProps) {
  return (
    <div className="relative bg-celebration rounded-2xl p-6 overflow-hidden animate-bounce-in">
      {/* Confetti background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#F4A261', '#E07A5F', '#9B8EC5', '#2A9D8F', '#6BAA75'][i % 5],
              animation: `confetti-fall ${2 + Math.random() * 2}s linear infinite`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.6
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center gap-6">
        <Mascot type={mascotType} mood="celebrating" size="lg" showMessage={false} />
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[var(--gray-600)] mt-1">{subtitle}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50 transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default Mascot
