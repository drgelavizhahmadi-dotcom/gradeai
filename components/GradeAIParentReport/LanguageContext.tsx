'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type LanguageCode = 'de' | 'en' | 'ar' | 'tr' | 'ro' | 'ru' | 'fa' | 'ku' | 'kmr'

export interface LanguageInfo {
  code: LanguageCode
  name: string
  flag: string
  dir: 'ltr' | 'rtl'
  englishName: string
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr', englishName: 'German' },
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr', englishName: 'English' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl', englishName: 'Arabic' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', dir: 'rtl', englishName: 'Farsi/Persian' },
  { code: 'ku', name: 'کوردی', flag: '🇮🇶', dir: 'rtl', englishName: 'Kurdish Sorani' },
  { code: 'kmr', name: 'Kurdî Kurmancî', flag: '🏳️', dir: 'ltr', englishName: 'Kurdish Kurmanji' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', dir: 'ltr', englishName: 'Turkish' },
  { code: 'ro', name: 'Română', flag: '🇷🇴', dir: 'ltr', englishName: 'Romanian' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr', englishName: 'Russian' },
]

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  isRTL: boolean
  currentLang: LanguageInfo
  languages: LanguageInfo[]
  targetLanguage: string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
  defaultLanguage?: LanguageCode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage 
}) => {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage first
      const saved = localStorage.getItem('gradeai-parent-report-language')
      if (saved && SUPPORTED_LANGUAGES.find(l => l.code === saved)) {
        return saved as LanguageCode
      }
      
      // Auto-detect browser language if no default provided
      if (!defaultLanguage) {
        const browserLang = navigator.language.split('-')[0] as LanguageCode
        const supported = SUPPORTED_LANGUAGES.find(l => l.code === browserLang)
        if (supported) {
          return browserLang
        }
      }
    }
    return defaultLanguage || 'en'
  })

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0]
  const isRTL = currentLang.dir === 'rtl'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gradeai-parent-report-language', language)
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
      document.documentElement.lang = language
    }
  }, [language, isRTL])

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      isRTL, 
      currentLang,
      languages: SUPPORTED_LANGUAGES,
      targetLanguage: currentLang.englishName
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
