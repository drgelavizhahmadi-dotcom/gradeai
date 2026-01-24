import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from './LanguageContext'
import { createTranslationPrompt } from './prompts/translationPrompt'

/**
 * Custom hook that handles report translation
 * 
 * Features:
 * - Caches translations per language
 * - Handles loading states
 * - Falls back to English on error
 * - Supports all 9 languages
 */

export interface TranslatedReport {
  translatedReport: {
    header: {
      title: string
      analyzedOn: string
      gradeExplanation: string
    }
    emotionalSupport: {
      greeting: string
      message: string
    }
    tabs: {
      overview: string
      analysis: string
      action: string
      strengths: string
    }
    sections: any
    common: any
    footer: {
      createdWith: string
      disclaimer: string
    }
  }
  metadata: {
    translatedTo: string
    translationTimestamp: string
  }
}

export const useReportTranslation = (rawAnalysisData: any) => {
  const { language, targetLanguage } = useLanguage()
  const [translatedData, setTranslatedData] = useState<TranslatedReport | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Cache key for this report + language
  const cacheKey = `gradeai-translation-${rawAnalysisData?.metadata?.analysisTimestamp}-${language}`
  
  const translateReport = useCallback(async () => {
    if (!rawAnalysisData) return
    
    setIsTranslating(true)
    setError(null)
    
    // Create abort controller for 30s timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    try {
      const prompt = createTranslationPrompt(rawAnalysisData, targetLanguage)
      
      // Call your AI service (Claude/Gemini/etc.)
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          targetLanguage,
          analysisData: rawAnalysisData
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) throw new Error('Translation failed')
      
      const translated = await response.json()
      
      // Cache the translation (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(translated))
      }
      
      setTranslatedData(translated)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Translation error:', err)
      const errorMsg = err.name === 'AbortError' ? 'Translation timeout (30s)' : err.message
      setError(errorMsg)
      // Fallback to English
      setTranslatedData(createEnglishReport(rawAnalysisData))
    } finally {
      setIsTranslating(false)
    }
  }, [rawAnalysisData, targetLanguage, cacheKey])
  
  // Check cache first
  useEffect(() => {
    if (!rawAnalysisData) return
    
    // If English, no translation needed
    if (language === 'en') {
      setTranslatedData(createEnglishReport(rawAnalysisData))
      return
    }
    
    // Check localStorage cache (only in browser)
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setTranslatedData(JSON.parse(cached))
          return
        } catch (e) {
          localStorage.removeItem(cacheKey)
        }
      }
    }
    
    // Need to translate
    translateReport()
  }, [rawAnalysisData, language, cacheKey, translateReport])
  
  // Force re-translation
  const retranslate = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey)
    }
    translateReport()
  }, [cacheKey, translateReport])
  
  return {
    translatedData,
    isTranslating,
    error,
    retranslate,
    isEnglish: language === 'en'
  }
}

// Create English report structure (no translation needed)
function createEnglishReport(rawData: any): TranslatedReport {
  return {
    translatedReport: {
      header: {
        title: 'GradeAI Parent Report',
        analyzedOn: `Analyzed on ${new Date().toLocaleDateString('en-US')}`,
        gradeExplanation: getGradeExplanation(rawData.header.grade, 'en')
      },
      emotionalSupport: {
        greeting: 'Dear Parents,',
        message: getEmotionalMessage(rawData.header.percentage, rawData.header.studentName, 'en')
      },
      tabs: {
        overview: 'Overview',
        analysis: 'Error Analysis',
        action: 'Action Plan',
        strengths: 'Strengths'
      },
      sections: {
        examStructure: {
          title: 'Exam Structure',
          taskLabels: {
            task: 'Task',
            type: 'Type',
            topic: 'Topic',
            requirement: 'Requirement',
            weight: 'Weight',
            wordCount: 'Word Count',
            points: 'Points',
            completed: 'Completed',
            incomplete: 'Incomplete'
          }
        },
        scores: {
          title: 'Score Breakdown',
          criteriaLabels: {
            content: 'Content',
            language: 'Language',
            structure: 'Structure',
            register: 'Register',
            grammar: 'Grammar',
            spelling: 'Spelling',
            total: 'Total',
            critical: 'Critical'
          }
        },
        fairness: {
          title: 'Fairness Assessment',
          overallLabel: 'Overall Assessment',
          assessmentLabels: {
            fair: 'Fair',
            possibly_strict: 'Possibly Strict',
            possibly_lenient: 'Possibly Lenient',
            review_recommended: 'Review Recommended'
          }
        },
        warnings: {
          title: 'Action Required',
          urgencyLabels: {
            immediate: 'Immediate (This Week)',
            shortTerm: 'Short-term (Next 2 Weeks)',
            mediumTerm: 'Medium-term (Next Month)'
          }
        },
        errorAnalysis: {
          title: 'Error Analysis',
          subtitle: 'Teaching examples from the test'
        },
        parentActions: {
          title: 'Parent Action Plan',
          thisWeekLabel: 'This Week',
          nextTwoWeeksLabel: 'Next Two Weeks'
        },
        learningPlan: {
          title: 'Prioritized Learning Plan',
          labels: {
            priority: 'Priority',
            duration: 'Duration',
            what: 'What',
            how: 'How',
            goal: 'Goal',
            resources: 'Resources',
            timeCommitment: 'Time'
          }
        },
        strengths: {
          title: 'Strengths & Hope',
          subtitle: 'What your child can already do',
          outlookTitle: 'Outlook'
        }
      },
      common: {
        yes: 'Yes',
        no: 'No',
        points: 'points',
        weeks: 'weeks',
        daily: 'daily',
        minutes: 'minutes',
        of: 'of',
        from: 'from'
      },
      footer: {
        createdWith: 'Created with GradeAI',
        disclaimer: 'This is an AI-generated analysis. Please discuss with your child\'s teacher.'
      }
    },
    metadata: {
      translatedTo: 'English',
      translationTimestamp: new Date().toISOString()
    }
  }
}

function getGradeExplanation(grade: string, lang: string): string {
  const explanations: Record<string, string> = {
    '1': 'Excellent - Outstanding performance',
    '2': 'Good - Above average',
    '3': 'Satisfactory - Average performance',
    '4': 'Adequate - Below average but passing',
    '5': 'Poor - Insufficient, needs improvement',
    '6': 'Very Poor - Failed'
  }
  const baseGrade = grade.replace(/[+-]/g, '')
  return explanations[baseGrade] || 'Grade assessment'
}

function getEmotionalMessage(percentage: number, studentName: string, lang: string): string {
  if (percentage < 50) {
    return `This grade indicates a need for support – but it's not a reason for despair. It shows us exactly where we can work together. With targeted support, significant improvement is achievable.`
  } else if (percentage < 70) {
    return `This grade shows solid foundations with room for improvement. With some targeted practice, ${studentName} can reach the next level.`
  }
  return `Congratulations! ${studentName} is showing excellent performance. Keep up the great work!`
}

export default useReportTranslation
