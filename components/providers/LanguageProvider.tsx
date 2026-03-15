'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, Translations, getTranslation } from '@/lib/translations'
import { useSession } from 'next-auth/react'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: session, update: updateSession } = useSession()
  const [language, setLanguageState] = useState<Language>('de')
  const [t, setT] = useState<Translations>(getTranslation('de'))

  // Initialize from session or localStorage
  useEffect(() => {
    const sessionLang = (session?.user as any)?.language as Language
    const savedLang = localStorage.getItem('language') as Language
    
    const initialLang = (sessionLang && isValidLanguage(sessionLang)) 
      ? sessionLang 
      : (savedLang && isValidLanguage(savedLang)) 
        ? savedLang 
        : 'de'

    applyLanguage(initialLang)
  }, [session?.user])

  const isValidLanguage = (lang: string): lang is Language => {
    return ['de', 'en', 'ar', 'tr', 'ro', 'ru', 'fa', 'ku', 'kmr'].includes(lang)
  }

  const applyLanguage = (lang: Language) => {
    setLanguageState(lang)
    setT(getTranslation(lang))
    localStorage.setItem('language', lang)
    
    // Set dir attribute for RTL languages
    if (['ar', 'fa', 'ku'].includes(lang)) {
      document.documentElement.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
    }
  }

  const setLanguage = async (lang: Language) => {
    applyLanguage(lang)
    
    // Persist to DB if user is logged in
    if (session?.user) {
      try {
        await fetch('/api/user/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang }),
        })
        
        // Update local session to avoid reload lag
        updateSession({ ...session, user: { ...session.user, language: lang } })
      } catch (err) {
        console.error('[LanguageSync] Failed to save preference:', err)
      }
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
