'use client'

import { useState } from 'react'

type Mood = 'happy' | 'thinking' | 'celebrating' | 'encouraging' | 'sleeping'

export interface OwlMascotProps {
  mood?: Mood
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  message?: string | undefined
  showMessage?: boolean
}

const sizeMap = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 160,
}

export function OwlMascot({
  mood = 'happy',
  size = 'md',
  className = '',
  message,
  showMessage = true
}: OwlMascotProps) {
  const [isHovered, setIsHovered] = useState(false)
  const pixelSize = sizeMap[size]

  // Eye expressions based on mood
  const getEyeExpression = () => {
    switch (mood) {
      case 'happy':
        return { leftEye: 'M32,38 Q36,42 40,38', rightEye: 'M56,38 Q60,42 64,38' } // Happy curved eyes
      case 'thinking':
        return { leftEye: 'M32,40 L40,40', rightEye: 'M56,38 L64,42' } // One raised eyebrow
      case 'celebrating':
        return { leftEye: 'M32,36 Q36,44 40,36', rightEye: 'M56,36 Q60,44 64,36' } // Extra happy
      case 'encouraging':
        return { leftEye: 'M32,40 L40,40', rightEye: 'M56,40 L64,40' } // Determined
      case 'sleeping':
        return { leftEye: 'M32,40 L40,40', rightEye: 'M56,40 L64,40' } // Closed
      default:
        return { leftEye: 'M32,38 Q36,42 40,38', rightEye: 'M56,38 Q60,42 64,38' }
    }
  }

  const eyes = getEyeExpression()

  // Default messages based on mood
  const defaultMessages: Record<Mood, string> = {
    happy: "Let's learn together!",
    thinking: "Hmm, let me think...",
    celebrating: "Amazing work!",
    encouraging: "You can do it!",
    sleeping: "Zzz..."
  }

  const displayMessage = message || defaultMessages[mood]

  return (
    <div
      className={`relative inline-flex flex-col items-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech bubble */}
      {showMessage && (isHovered || mood === 'celebrating') && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-bounce-in">
          <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-[var(--gray-200)] text-sm font-medium text-[var(--gray-700)]">
            {displayMessage}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r border-b border-[var(--gray-200)]" />
          </div>
        </div>
      )}

      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 96 96"
        className={`companion ${mood === 'celebrating' ? 'animate-float companion-happy' : ''} ${isHovered ? 'animate-wiggle' : ''}`}
        style={{ transition: 'all 0.3s ease' }}
      >
        {/* Body */}
        <ellipse cx="48" cy="58" rx="28" ry="32" fill="#8B7355" />
        <ellipse cx="48" cy="58" rx="22" ry="26" fill="#F4E4D4" />

        {/* Wings */}
        <ellipse cx="22" cy="55" rx="10" ry="18" fill="#6B5344" className={mood === 'celebrating' ? 'origin-center animate-pulse' : ''} />
        <ellipse cx="74" cy="55" rx="10" ry="18" fill="#6B5344" className={mood === 'celebrating' ? 'origin-center animate-pulse' : ''} />

        {/* Head feather tufts */}
        <path d="M28,20 Q32,8 36,20" stroke="#8B7355" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M60,20 Q64,8 68,20" stroke="#8B7355" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* Face disc */}
        <circle cx="36" cy="40" r="16" fill="#F9F3ED" />
        <circle cx="60" cy="40" r="16" fill="#F9F3ED" />

        {/* Eyes */}
        {mood === 'sleeping' ? (
          <>
            <path d="M28,40 L44,40" stroke="#4A453C" strokeWidth="3" strokeLinecap="round" />
            <path d="M52,40 L68,40" stroke="#4A453C" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Eye whites */}
            <circle cx="36" cy="40" r="10" fill="white" />
            <circle cx="60" cy="40" r="10" fill="white" />

            {/* Pupils - follow hover direction slightly */}
            <circle
              cx={isHovered ? 38 : 36}
              cy={isHovered ? 41 : 40}
              r="5"
              fill="#2D2A26"
              style={{ transition: 'all 0.2s ease' }}
            />
            <circle
              cx={isHovered ? 62 : 60}
              cy={isHovered ? 41 : 40}
              r="5"
              fill="#2D2A26"
              style={{ transition: 'all 0.2s ease' }}
            />

            {/* Eye shine */}
            <circle cx="34" cy="38" r="2" fill="white" />
            <circle cx="58" cy="38" r="2" fill="white" />
          </>
        )}

        {/* Beak */}
        <path d="M44,48 L48,56 L52,48 Z" fill="#F4A261" />

        {/* Blush marks when happy/celebrating */}
        {(mood === 'happy' || mood === 'celebrating') && (
          <>
            <circle cx="24" cy="48" r="4" fill="#E07A5F" opacity="0.4" />
            <circle cx="72" cy="48" r="4" fill="#E07A5F" opacity="0.4" />
          </>
        )}

        {/* Feet */}
        <path d="M36,86 L32,92 M36,86 L36,92 M36,86 L40,92" stroke="#F4A261" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M60,86 L56,92 M60,86 L60,92 M60,86 L64,92" stroke="#F4A261" strokeWidth="2.5" strokeLinecap="round" />

        {/* Graduation cap for celebrating */}
        {mood === 'celebrating' && (
          <g className="animate-bounce-in">
            <rect x="28" y="6" width="40" height="4" fill="#2A9D8F" rx="1" />
            <polygon points="48,0 28,10 68,10" fill="#2A9D8F" />
            <circle cx="68" cy="10" r="2" fill="#F4A261" />
            <path d="M68,10 Q75,16 70,22" stroke="#F4A261" strokeWidth="2" fill="none" />
          </g>
        )}

        {/* Stars around when celebrating */}
        {mood === 'celebrating' && (
          <>
            <text x="10" y="30" fontSize="12" className="animate-sparkle">✨</text>
            <text x="78" y="25" fontSize="10" className="animate-sparkle" style={{ animationDelay: '0.3s' }}>⭐</text>
            <text x="5" y="60" fontSize="8" className="animate-sparkle" style={{ animationDelay: '0.6s' }}>✨</text>
            <text x="85" y="55" fontSize="10" className="animate-sparkle" style={{ animationDelay: '0.2s' }}>🌟</text>
          </>
        )}

        {/* Thinking bubble */}
        {mood === 'thinking' && (
          <>
            <circle cx="78" cy="20" r="3" fill="#D4CFC5" />
            <circle cx="84" cy="12" r="4" fill="#D4CFC5" />
            <circle cx="92" cy="6" r="5" fill="#D4CFC5" />
          </>
        )}
      </svg>
    </div>
  )
}

export default OwlMascot
