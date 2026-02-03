'use client'

import { useState } from 'react'

type Mood = 'happy' | 'thinking' | 'celebrating' | 'encouraging' | 'sleeping'

export interface CatMascotProps {
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

export function CatMascot({
  mood = 'happy',
  size = 'md',
  className = '',
  message,
  showMessage = true
}: CatMascotProps) {
  const [isHovered, setIsHovered] = useState(false)
  const pixelSize = sizeMap[size]

  const defaultMessages: Record<Mood, string> = {
    happy: "Purrfect learning!",
    thinking: "Hmm, interesting...",
    celebrating: "Meow-velous!",
    encouraging: "You've got this!",
    sleeping: "Purrrr..."
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
          d="M72,70 Q90,60 88,40 Q86,25 78,30"
          stroke="#9B8EC5"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={mood === 'celebrating' ? 'origin-bottom-left animate-pulse' : ''}
        />

        {/* Body */}
        <ellipse cx="48" cy="65" rx="26" ry="24" fill="#9B8EC5" />
        <ellipse cx="48" cy="70" rx="20" ry="16" fill="#E8E0F0" />

        {/* Head */}
        <circle cx="48" cy="36" r="24" fill="#9B8EC5" />

        {/* Ears */}
        <path d="M24,26 L18,4 L38,20 Z" fill="#9B8EC5" />
        <path d="M26,22 L22,8 L36,20 Z" fill="#E8C0D0" />
        <path d="M72,26 L78,4 L58,20 Z" fill="#9B8EC5" />
        <path d="M70,22 L74,8 L60,20 Z" fill="#E8C0D0" />

        {/* Face */}
        <ellipse cx="48" cy="42" rx="16" ry="12" fill="#E8E0F0" />

        {/* Eyes */}
        {mood === 'sleeping' ? (
          <>
            <path d="M34,36 Q40,40 46,36" stroke="#4A453C" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M50,36 Q56,40 62,36" stroke="#4A453C" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Cat eyes - almond shaped */}
            <ellipse cx="38" cy="36" rx="6" ry="7" fill="#B5AADB" />
            <ellipse cx="58" cy="36" rx="6" ry="7" fill="#B5AADB" />
            {/* Pupils - vertical slits */}
            <ellipse
              cx={isHovered ? 39 : 38}
              cy="36"
              rx="2"
              ry={mood === 'happy' || mood === 'celebrating' ? 4 : 6}
              fill="#2D2A26"
              style={{ transition: 'all 0.2s ease' }}
            />
            <ellipse
              cx={isHovered ? 59 : 58}
              cy="36"
              rx="2"
              ry={mood === 'happy' || mood === 'celebrating' ? 4 : 6}
              fill="#2D2A26"
              style={{ transition: 'all 0.2s ease' }}
            />
            {/* Eye shine */}
            <circle cx="36" cy="34" r="1.5" fill="white" />
            <circle cx="56" cy="34" r="1.5" fill="white" />
          </>
        )}

        {/* Nose */}
        <path d="M45,44 L48,48 L51,44 Z" fill="#E8C0D0" />

        {/* Mouth */}
        <path d="M48,48 L48,52" stroke="#4A453C" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d={mood === 'happy' || mood === 'celebrating'
            ? "M42,52 Q48,56 54,52"
            : "M44,52 Q48,54 52,52"}
          stroke="#4A453C"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Whiskers */}
        <g stroke="#B0A99B" strokeWidth="1" strokeLinecap="round">
          <path d="M32,44 L14,40" />
          <path d="M32,48 L14,48" />
          <path d="M32,52 L14,56" />
          <path d="M64,44 L82,40" />
          <path d="M64,48 L82,48" />
          <path d="M64,52 L82,56" />
        </g>

        {/* Blush */}
        {(mood === 'happy' || mood === 'celebrating') && (
          <>
            <circle cx="28" cy="44" r="4" fill="#E8C0D0" opacity="0.6" />
            <circle cx="68" cy="44" r="4" fill="#E8C0D0" opacity="0.6" />
          </>
        )}

        {/* Paws */}
        <ellipse cx="36" cy="86" rx="8" ry="5" fill="#9B8EC5" />
        <ellipse cx="60" cy="86" rx="8" ry="5" fill="#9B8EC5" />
        {/* Paw pads */}
        <circle cx="36" cy="87" r="2" fill="#E8C0D0" />
        <circle cx="60" cy="87" r="2" fill="#E8C0D0" />

        {/* Stripes on forehead */}
        <path d="M42,20 L42,28" stroke="#7A6BA8" strokeWidth="2" strokeLinecap="round" />
        <path d="M48,18 L48,26" stroke="#7A6BA8" strokeWidth="2" strokeLinecap="round" />
        <path d="M54,20 L54,28" stroke="#7A6BA8" strokeWidth="2" strokeLinecap="round" />

        {/* Stars when celebrating */}
        {mood === 'celebrating' && (
          <>
            <text x="6" y="28" fontSize="12" className="animate-sparkle">✨</text>
            <text x="82" y="22" fontSize="10" className="animate-sparkle" style={{ animationDelay: '0.3s' }}>⭐</text>
            <text x="2" y="55" fontSize="8" className="animate-sparkle" style={{ animationDelay: '0.5s' }}>🌟</text>
            <text x="88" y="50" fontSize="9" className="animate-sparkle" style={{ animationDelay: '0.7s' }}>✨</text>
          </>
        )}

        {/* Thinking bubbles */}
        {mood === 'thinking' && (
          <>
            <circle cx="76" cy="18" r="3" fill="#D4CFC5" />
            <circle cx="84" cy="10" r="4" fill="#D4CFC5" />
            <circle cx="92" cy="4" r="5" fill="#D4CFC5" />
          </>
        )}
      </svg>
    </div>
  )
}

export default CatMascot
