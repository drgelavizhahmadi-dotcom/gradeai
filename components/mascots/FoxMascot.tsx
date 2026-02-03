'use client'

import { useState } from 'react'

type Mood = 'happy' | 'thinking' | 'celebrating' | 'encouraging' | 'sleeping'

export interface FoxMascotProps {
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

export function FoxMascot({
  mood = 'happy',
  size = 'md',
  className = '',
  message,
  showMessage = true
}: FoxMascotProps) {
  const [isHovered, setIsHovered] = useState(false)
  const pixelSize = sizeMap[size]

  const defaultMessages: Record<Mood, string> = {
    happy: "Ready to explore!",
    thinking: "Curious...",
    celebrating: "Fantastic job!",
    encouraging: "Keep going!",
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
      >
        {/* Tail */}
        <path
          d="M70,65 Q95,50 85,75 Q75,90 65,75"
          fill="#E07A5F"
          className={mood === 'celebrating' ? 'origin-bottom-left animate-pulse' : ''}
        />
        <path d="M80,72 Q85,85 70,78" fill="#F4E4D4" />

        {/* Body */}
        <ellipse cx="48" cy="65" rx="25" ry="22" fill="#E07A5F" />
        <ellipse cx="48" cy="70" rx="18" ry="14" fill="#F4E4D4" />

        {/* Head */}
        <ellipse cx="48" cy="38" rx="22" ry="20" fill="#E07A5F" />

        {/* Ears */}
        <path d="M26,28 L20,8 L36,22 Z" fill="#E07A5F" />
        <path d="M28,24 L24,12 L34,22 Z" fill="#E99A85" />
        <path d="M70,28 L76,8 L60,22 Z" fill="#E07A5F" />
        <path d="M68,24 L72,12 L62,22 Z" fill="#E99A85" />

        {/* Face mask */}
        <ellipse cx="48" cy="42" rx="14" ry="12" fill="#F4E4D4" />
        <path d="M34,38 L48,52 L62,38" fill="#F4E4D4" />

        {/* Eyes */}
        {mood === 'sleeping' ? (
          <>
            <path d="M36,36 L44,36" stroke="#4A453C" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M52,36 L60,36" stroke="#4A453C" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="40" cy="36" rx="5" ry={mood === 'happy' || mood === 'celebrating' ? 3 : 5} fill="#2D2A26" />
            <ellipse cx="56" cy="36" rx="5" ry={mood === 'happy' || mood === 'celebrating' ? 3 : 5} fill="#2D2A26" />
            <circle cx="38" cy="34" r="1.5" fill="white" />
            <circle cx="54" cy="34" r="1.5" fill="white" />
          </>
        )}

        {/* Nose */}
        <ellipse cx="48" cy="46" rx="4" ry="3" fill="#2D2A26" />
        <circle cx="47" cy="45" r="1" fill="white" opacity="0.5" />

        {/* Mouth */}
        <path
          d={mood === 'happy' || mood === 'celebrating' ? "M44,50 Q48,54 52,50" : "M45,50 L51,50"}
          stroke="#2D2A26"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Whiskers */}
        <g stroke="#B0A99B" strokeWidth="1" strokeLinecap="round">
          <path d="M30,44 L18,42" />
          <path d="M30,48 L18,50" />
          <path d="M66,44 L78,42" />
          <path d="M66,48 L78,50" />
        </g>

        {/* Blush */}
        {(mood === 'happy' || mood === 'celebrating') && (
          <>
            <circle cx="30" cy="42" r="4" fill="#E99A85" opacity="0.5" />
            <circle cx="66" cy="42" r="4" fill="#E99A85" opacity="0.5" />
          </>
        )}

        {/* Feet */}
        <ellipse cx="38" cy="86" rx="6" ry="4" fill="#E07A5F" />
        <ellipse cx="58" cy="86" rx="6" ry="4" fill="#E07A5F" />

        {/* Stars when celebrating */}
        {mood === 'celebrating' && (
          <>
            <text x="8" y="30" fontSize="12" className="animate-sparkle">✨</text>
            <text x="80" y="25" fontSize="10" className="animate-sparkle" style={{ animationDelay: '0.3s' }}>⭐</text>
            <text x="5" y="55" fontSize="8" className="animate-sparkle" style={{ animationDelay: '0.5s' }}>🌟</text>
          </>
        )}

        {/* Thinking bubbles */}
        {mood === 'thinking' && (
          <>
            <circle cx="75" cy="22" r="3" fill="#D4CFC5" />
            <circle cx="82" cy="14" r="4" fill="#D4CFC5" />
            <circle cx="90" cy="8" r="5" fill="#D4CFC5" />
          </>
        )}
      </svg>
    </div>
  )
}

export default FoxMascot
