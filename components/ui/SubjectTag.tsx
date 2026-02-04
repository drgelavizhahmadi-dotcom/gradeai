'use client'

interface SubjectTagProps {
  subject: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const subjectConfig: Record<string, { class: string; icon: string }> = {
  // German subjects
  'Mathematik': { class: 'subject-math', icon: '📐' },
  'Mathe': { class: 'subject-math', icon: '📐' },
  'Math': { class: 'subject-math', icon: '📐' },
  'Mathematics': { class: 'subject-math', icon: '📐' },

  'Deutsch': { class: 'subject-german', icon: '📝' },
  'German': { class: 'subject-german', icon: '📝' },

  'Englisch': { class: 'subject-english', icon: '🇬🇧' },
  'English': { class: 'subject-english', icon: '🇬🇧' },

  'Sachunterricht': { class: 'subject-science', icon: '🔬' },
  'Sachkunde': { class: 'subject-science', icon: '🔬' },
  'Science': { class: 'subject-science', icon: '🔬' },
  'Biologie': { class: 'subject-science', icon: '🧬' },
  'Biology': { class: 'subject-science', icon: '🧬' },
  'Physik': { class: 'subject-science', icon: '⚛️' },
  'Physics': { class: 'subject-science', icon: '⚛️' },
  'Chemie': { class: 'subject-science', icon: '🧪' },
  'Chemistry': { class: 'subject-science', icon: '🧪' },

  'Geschichte': { class: 'bg-[var(--coral-soft)] text-[var(--coral-dark)]', icon: '🏛️' },
  'History': { class: 'bg-[var(--coral-soft)] text-[var(--coral-dark)]', icon: '🏛️' },

  'Kunst': { class: 'bg-[var(--lavender-soft)] text-[var(--lavender-dark)]', icon: '🎨' },
  'Art': { class: 'bg-[var(--lavender-soft)] text-[var(--lavender-dark)]', icon: '🎨' },

  'Musik': { class: 'bg-[var(--coral-soft)] text-[var(--coral-dark)]', icon: '🎵' },
  'Music': { class: 'bg-[var(--coral-soft)] text-[var(--coral-dark)]', icon: '🎵' },

  'Sport': { class: 'bg-[var(--success-soft)] text-[var(--success-dark)]', icon: '⚽' },

  'Religion': { class: 'bg-[var(--gold-soft)] text-[var(--gold-dark)]', icon: '✨' },
  'Ethik': { class: 'bg-[var(--gold-soft)] text-[var(--gold-dark)]', icon: '💭' },
}

export function SubjectTag({ subject, size = 'md', showIcon = true }: SubjectTagProps) {
  const config = subjectConfig[subject] || { class: 'subject-default', icon: '📚' }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  return (
    <span
      className={`
        subject-tag ${config.class} ${sizeClasses[size]}
        inline-flex items-center gap-1.5 rounded-full font-semibold
      `}
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {showIcon && <span>{config.icon}</span>}
      {subject}
    </span>
  )
}

// Subject icon only (for compact displays)
export function SubjectIcon({ subject, size = 20 }: { subject: string; size?: number }) {
  const config = subjectConfig[subject] || { icon: '📚' }
  return <span style={{ fontSize: size }}>{config.icon}</span>
}

export default SubjectTag
