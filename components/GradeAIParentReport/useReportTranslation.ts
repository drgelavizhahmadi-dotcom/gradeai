import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'


/**
 * Custom hook that handles report translation
 * 
 * Features:
 * - Checks DB cache first (via translate-report API)
 * - AI translates from German source of truth if not cached
 * - Saves translations to DB for reuse
 * - Falls back to German on error
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

export const useReportTranslation = (rawAnalysisData: any, uploadId?: string) => {
  const { language } = useLanguage()

  const [translatedData, setTranslatedData] = useState<TranslatedReport | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const translateReport = useCallback(async () => {
    if (!rawAnalysisData) return

    setIsTranslating(true)
    setError(null)

    // German is the source of truth — create German labels directly (Instant)
    if (language === 'de') {
      setTranslatedData(createGermanReport(rawAnalysisData))
      setIsTranslating(false)
      return
    }

    // For all other languages (English, Persian, etc.), call the translate-report API
    // which checks DB cache first, then AI translates + saves if not cached
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch('/api/ai/translate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: rawAnalysisData,
          targetLanguage: language,
          uploadId: uploadId,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) throw new Error('Translation failed')

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Translation failed')
      }

      // The API returns the full translated report
      // We wrap it in TranslatedReport format for the component
      const translatedReport = data.translatedReport
      setTranslatedData(wrapAsTranslatedReport(translatedReport, language))
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Translation error:', err)
      const errorMsg = err.name === 'AbortError' ? 'Translation timeout (30s)' : err.message
      setError(errorMsg)
      
      // Fallback: If AI fails, we still show the German version as backup
      // instead of a broken English manual one
      setTranslatedData(createGermanReport(rawAnalysisData))
    } finally {
      setIsTranslating(false)
    }
  }, [rawAnalysisData, language, uploadId])

  useEffect(() => {
    if (!rawAnalysisData) return
    translateReport()
  }, [rawAnalysisData, language, translateReport])

  // Force re-translation (clears DB cache too via fresh API call)
  const retranslate = useCallback(() => {
    translateReport()
  }, [translateReport])

  return {
    translatedData,
    isTranslating,
    error,
    retranslate,
    isEnglish: language === 'en'
  }
}

// Wrap a raw translated report into TranslatedReport format for the component
function wrapAsTranslatedReport(report: any, language: string): TranslatedReport {
  return {
    translatedReport: {
      header: {
        title: report.messages?.toParents ? 'GradeAI' : 'GradeAI Parent Report',
        analyzedOn: report.test?.date || new Date().toLocaleDateString(),
        gradeExplanation: report.grade?.description || '',
      },
      emotionalSupport: {
        greeting: report.messages?.toParents?.split('.')[0] || 'Dear Parents,',
        message: report.messages?.toParents || '',
      },
      tabs: {
        overview: language === 'de' ? 'Überblick' : 'Overview',
        analysis: language === 'de' ? 'Fehleranalyse' : 'Error Analysis',
        action: language === 'de' ? 'Aktionsplan' : 'Action Plan',
        strengths: language === 'de' ? 'Stärken' : 'Strengths',
      },
      sections: report,
      common: {
        yes: language === 'de' ? 'Ja' : 'Yes',
        no: language === 'de' ? 'Nein' : 'No',
        points: language === 'de' ? 'Punkte' : 'points',
        weeks: language === 'de' ? 'Wochen' : 'weeks',
        daily: language === 'de' ? 'täglich' : 'daily',
        minutes: language === 'de' ? 'Minuten' : 'minutes',
        of: language === 'de' ? 'von' : 'of',
        from: language === 'de' ? 'von' : 'from',
      },
      footer: {
        createdWith: language === 'de' ? 'Erstellt mit GradeAI' : 'Created with GradeAI',
        disclaimer: language === 'de'
          ? 'Dies ist eine KI-generierte Analyse. Bitte besprechen Sie diese mit dem Lehrer Ihres Kindes.'
          : 'This is an AI-generated analysis. Please discuss with your child\'s teacher.',
      },
    },
    metadata: {
      translatedTo: language,
      translationTimestamp: new Date().toISOString(),
    },
  }
}

// Create German report structure (source of truth — no AI needed)
function createGermanReport(rawData: any): TranslatedReport {
  return {
    translatedReport: {
      header: {
        title: 'GradeAI Elternbericht',
        analyzedOn: `Analysiert am ${new Date().toLocaleDateString('de-DE')}`,
        gradeExplanation: getGradeExplanation(rawData.header?.grade || rawData.grade?.value, 'de'),
      },
      emotionalSupport: {
        greeting: 'Liebe Eltern,',
        message: getEmotionalMessage(rawData.header?.percentage || 0, rawData.header?.studentName || rawData.student?.name || '', 'de'),
      },
      tabs: {
        overview: 'Überblick',
        analysis: 'Fehleranalyse',
        action: 'Aktionsplan',
        strengths: 'Stärken',
      },
      sections: {
        examStructure: {
          title: 'Prüfungsaufbau',
          taskLabels: {
            task: 'Aufgabe', type: 'Art', topic: 'Thema',
            requirement: 'Anforderung', weight: 'Gewichtung',
            wordCount: 'Wortanzahl', points: 'Punkte',
            completed: 'Erledigt', incomplete: 'Unvollständig',
          },
        },
        scores: {
          title: 'Punkteübersicht',
          criteriaLabels: {
            content: 'Inhalt', language: 'Sprache', structure: 'Struktur',
            register: 'Register', grammar: 'Grammatik', spelling: 'Rechtschreibung',
            total: 'Gesamt', critical: 'Kritisch',
          },
        },
        fairness: {
          title: 'Fairnessbewertung',
          overallLabel: 'Gesamtbewertung',
          assessmentLabels: {
            fair: 'Fair', possibly_strict: 'Möglicherweise streng',
            possibly_lenient: 'Möglicherweise milde', review_recommended: 'Überprüfung empfohlen',
          },
        },
        warnings: {
          title: 'Handlungsbedarf',
          urgencyLabels: {
            immediate: 'Sofort (diese Woche)', shortTerm: 'Kurzfristig (nächste 2 Wochen)',
            mediumTerm: 'Mittelfristig (nächster Monat)',
          },
        },
        errorAnalysis: {
          title: 'Fehleranalyse',
          subtitle: 'Lehrbeispiele aus dem Test',
        },
        parentActions: {
          title: 'Eltern-Aktionsplan',
          thisWeekLabel: 'Diese Woche',
          nextTwoWeeksLabel: 'Nächste zwei Wochen',
        },
        learningPlan: {
          title: 'Priorisierter Lernplan',
          labels: {
            priority: 'Priorität', duration: 'Dauer', what: 'Was', how: 'Wie',
            goal: 'Ziel', resources: 'Materialien', timeCommitment: 'Zeit',
          },
        },
        strengths: {
          title: 'Stärken & Hoffnung',
          subtitle: 'Was Ihr Kind schon kann',
          outlookTitle: 'Ausblick',
        },
      },
      common: {
        yes: 'Ja', no: 'Nein', points: 'Punkte', weeks: 'Wochen',
        daily: 'täglich', minutes: 'Minuten', of: 'von', from: 'von',
      },
      footer: {
        createdWith: 'Erstellt mit GradeAI',
        disclaimer: 'Dies ist eine KI-generierte Analyse. Bitte besprechen Sie diese mit dem Lehrer Ihres Kindes.',
      },
    },
    metadata: {
      translatedTo: 'German',
      translationTimestamp: new Date().toISOString(),
    },
  }
}

// Create English report structure (no AI needed)
function createEnglishReport(rawData: any): TranslatedReport {
  return {
    translatedReport: {
      header: {
        title: 'GradeAI Parent Report',
        analyzedOn: `Analyzed on ${new Date().toLocaleDateString('en-US')}`,
        gradeExplanation: getGradeExplanation(rawData.header?.grade || rawData.grade?.value, 'en'),
      },
      emotionalSupport: {
        greeting: 'Dear Parents,',
        message: getEmotionalMessage(rawData.header?.percentage || 0, rawData.header?.studentName || rawData.student?.name || '', 'en'),
      },
      tabs: {
        overview: 'Overview',
        analysis: 'Error Analysis',
        action: 'Action Plan',
        strengths: 'Strengths',
      },
      sections: {
        examStructure: {
          title: 'Exam Structure',
          taskLabels: {
            task: 'Task', type: 'Type', topic: 'Topic',
            requirement: 'Requirement', weight: 'Weight',
            wordCount: 'Word Count', points: 'Points',
            completed: 'Completed', incomplete: 'Incomplete',
          },
        },
        scores: {
          title: 'Score Breakdown',
          criteriaLabels: {
            content: 'Content', language: 'Language', structure: 'Structure',
            register: 'Register', grammar: 'Grammar', spelling: 'Spelling',
            total: 'Total', critical: 'Critical',
          },
        },
        fairness: {
          title: 'Fairness Assessment',
          overallLabel: 'Overall Assessment',
          assessmentLabels: {
            fair: 'Fair', possibly_strict: 'Possibly Strict',
            possibly_lenient: 'Possibly Lenient', review_recommended: 'Review Recommended',
          },
        },
        warnings: {
          title: 'Action Required',
          urgencyLabels: {
            immediate: 'Immediate (This Week)', shortTerm: 'Short-term (Next 2 Weeks)',
            mediumTerm: 'Medium-term (Next Month)',
          },
        },
        errorAnalysis: {
          title: 'Error Analysis',
          subtitle: 'Teaching examples from the test',
        },
        parentActions: {
          title: 'Parent Action Plan',
          thisWeekLabel: 'This Week',
          nextTwoWeeksLabel: 'Next Two Weeks',
        },
        learningPlan: {
          title: 'Prioritized Learning Plan',
          labels: {
            priority: 'Priority', duration: 'Duration', what: 'What', how: 'How',
            goal: 'Goal', resources: 'Resources', timeCommitment: 'Time',
          },
        },
        strengths: {
          title: 'Strengths & Hope',
          subtitle: 'What your child can already do',
          outlookTitle: 'Outlook',
        },
      },
      common: {
        yes: 'Yes', no: 'No', points: 'points', weeks: 'weeks',
        daily: 'daily', minutes: 'minutes', of: 'of', from: 'from',
      },
      footer: {
        createdWith: 'Created with GradeAI',
        disclaimer: 'This is an AI-generated analysis. Please discuss with your child\'s teacher.',
      },
    },
    metadata: {
      translatedTo: 'English',
      translationTimestamp: new Date().toISOString(),
    },
  }
}

function getGradeExplanation(grade: string, lang: string): string {
  const explanations: Record<string, Record<string, string>> = {
    de: {
      '1': 'Sehr gut – herausragende Leistung',
      '2': 'Gut – überdurchschnittlich',
      '3': 'Befriedigend – durchschnittliche Leistung',
      '4': 'Ausreichend – unterdurchschnittlich, aber bestanden',
      '5': 'Mangelhaft – ungenügend, Verbesserung nötig',
      '6': 'Ungenügend – nicht bestanden',
    },
    en: {
      '1': 'Excellent - Outstanding performance',
      '2': 'Good - Above average',
      '3': 'Satisfactory - Average performance',
      '4': 'Adequate - Below average but passing',
      '5': 'Poor - Insufficient, needs improvement',
      '6': 'Very Poor - Failed',
    },
  }
  if (!grade) return ''
  const baseGrade = String(grade).replace(/[+-]/g, '')
  return explanations[lang]?.[baseGrade] || explanations.en?.[baseGrade] || 'Grade assessment'
}

function getEmotionalMessage(percentage: number, studentName: string, lang: string): string {
  if (lang === 'de') {
    if (percentage < 50) {
      return `Diese Note zeigt, dass Unterstützung gebraucht wird – aber das ist kein Grund zur Verzweiflung. Sie zeigt uns genau, wo wir gemeinsam arbeiten können. Mit gezielter Förderung ist eine deutliche Verbesserung möglich.`
    } else if (percentage < 70) {
      return `Diese Note zeigt solide Grundlagen mit Raum für Verbesserungen. Mit etwas gezieltem Üben kann ${studentName} die nächste Stufe erreichen.`
    }
    return `Herzlichen Glückwunsch! ${studentName} zeigt hervorragende Leistungen. Weiter so!`
  }

  if (percentage < 50) {
    return `This grade indicates a need for support – but it's not a reason for despair. It shows us exactly where we can work together. With targeted support, significant improvement is achievable.`
  } else if (percentage < 70) {
    return `This grade shows solid foundations with room for improvement. With some targeted practice, ${studentName} can reach the next level.`
  }
  return `Congratulations! ${studentName} is showing excellent performance. Keep up the great work!`
}

export default useReportTranslation
