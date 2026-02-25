'use client'

import { useState, useEffect } from 'react'
import {
  Lock, Sparkles, Crown, Zap, BookOpen, Shield, ChevronRight,
  Star, TrendingUp, Users, Clock, Gift, ArrowRight, Check,
  Loader2, X, Download, Printer, AlertTriangle, CheckCircle,
  GraduationCap, FileText, ClipboardCheck, ChevronDown, ChevronUp,
  Brain, Target, Lightbulb, PlayCircle
} from 'lucide-react'
import {
  generateFlashcardsPDF,
  generateFairnessPDF,
  generateLearningMaterialPDF
} from '@/lib/pdf/generate-pdf'

// FOMO Statistics (can be fetched from API in production)
const FOMO_STATS = {
  upgradesThisWeek: 347,
  parentsSatisfied: 94,
  avgGradeImprovement: 0.8,
  flashcardsGenerated: 12847,
  fairnessChecksRun: 8293,
  learningMaterialsGenerated: 5621,
}

interface PremiumFeatureProps {
  isPremium: boolean
  childName?: string | undefined
  analysisData: any
  onUpgrade?: (() => void) | undefined
}

interface IndependentFeatureProps extends PremiumFeatureProps {
  extractedText?: string | null | undefined
  grade?: number | undefined
  subject?: string | undefined
  schoolType?: string | undefined
  language?: string | undefined
  uploadId?: string | undefined
  cachedData?: any | undefined
}

// Keep backward compat alias
type LearningMaterialProps = IndependentFeatureProps

// UI chrome translations for premium features
// German is default, English for all other languages
function getPremiumT(lang: string = 'de') {
  const isDE = lang === 'de'
  return {
    // Flashcards
    flashcardsTitle: isDE ? 'Personalisierte Lernkarten' : 'Personalized Flashcards',
    flashcardsDesc: (name: string) => isDE ? `Maßgeschneidert für ${name}` : `Tailored for ${name}`,
    generateCards: isDE ? 'Lernkarten generieren' : 'Generate Flashcards',
    generatingCards: isDE ? 'Erstelle Karten...' : 'Creating cards...',
    studyPlan: isDE ? 'Lernplan' : 'Study Plan',
    dailyGoal: isDE ? 'Tägliches Ziel:' : 'Daily Goal:',
    totalTime: isDE ? 'Gesamtzeit:' : 'Total Time:',
    reviewSchedule: isDE ? 'Wiederholung:' : 'Review:',
    easy: isDE ? 'Leicht' : 'Easy',
    medium: isDE ? 'Mittel' : 'Medium',
    hard: isDE ? 'Schwer' : 'Hard',
    clickToFlip: isDE ? 'Klicken zum Umdrehen' : 'Click to flip',
    forWeakness: isDE ? 'Für:' : 'For:',
    answer: isDE ? 'Antwort' : 'Answer',
    print: isDE ? 'Drucken' : 'Print',
    downloadPDF: isDE ? 'PDF herunterladen' : 'Download PDF',
    errorOccurred: isDE ? 'Ein Fehler ist aufgetreten' : 'An error occurred',
    // Flashcards locked
    flashcardsLockedTitle: isDE ? 'Personalisierte Lernkarten' : 'Personalized Flashcards',
    flashcardsLockedDesc: (count: number, name: string) =>
      isDE ? `${count}+ Lernkarten speziell für ${name} basierend auf den Testschwächen` : `${count}+ flashcards tailored for ${name} based on test weaknesses`,
    cardsCreated: isDE ? 'Karten erstellt' : 'Cards created',
    gradeImprovement: isDE ? 'Notenverbesserung' : 'Grade improvement',

    // Fairness
    fairnessTitle: isDE ? 'Fairness-Check' : 'Fairness Check',
    fairnessDesc: isDE ? 'Unabhängige Analyse der Bewertung' : 'Independent grading analysis',
    fairnessLockedTitle: isDE ? 'Fairness-Check der Bewertung' : 'Grading Fairness Check',
    fairnessLockedDesc: isDE ? 'Wurde Ihr Kind fair bewertet? KI-Analyse der Benotung mit konkreten Handlungsempfehlungen' : 'Was your child graded fairly? AI analysis with actionable recommendations',
    checkFairness: isDE ? 'Fairness prüfen' : 'Check Fairness',
    analyzingIndependently: isDE ? 'Analysiere unabhängig...' : 'Analyzing independently...',
    independentAIAnalysis: isDE ? 'Unabhängige KI-Analyse' : 'Independent AI Analysis',
    questionsAnalyzed: isDE ? 'Aufgaben analysiert' : 'questions analyzed',
    concernsFound: isDE ? 'Bedenken gefunden' : 'concerns found',
    generatedIn: isDE ? 'Generiert in' : 'Generated in',
    fairnessScore: isDE ? 'Fairness-Score' : 'Fairness Score',
    checksPerformed: isDE ? 'Checks durchgeführt' : 'Checks performed',
    parentsSatisfied: isDE ? 'Eltern zufrieden' : 'Parents satisfied',
    // Verdicts
    verdictFair: isDE ? 'Bewertung ist fair' : 'Grading is fair',
    verdictMostlyFair: isDE ? 'Überwiegend fair' : 'Mostly fair',
    verdictSomeConcerns: isDE ? 'Einige Bedenken' : 'Some concerns',
    verdictQuestionable: isDE ? 'Fragwürdig' : 'Questionable',
    verdictNeedsReview: isDE ? 'Überprüfung empfohlen' : 'Review recommended',
    verdictNA: isDE ? 'Nicht bewertbar' : 'Not assessable',
    // Dimensions
    gradingConsistency: isDE ? 'Bewertungskonsistenz' : 'Grading Consistency',
    pointProportionality: isDE ? 'Punktverhältnismäßigkeit' : 'Point Proportionality',
    partialCredit: isDE ? 'Teilpunkte-Vergabe' : 'Partial Credit',
    clarityOfExpectations: isDE ? 'Klarheit der Erwartungen' : 'Clarity of Expectations',
    feedbackQuality: isDE ? 'Feedback-Qualität' : 'Feedback Quality',
    mathematicalAccuracy: isDE ? 'Rechnerische Korrektheit' : 'Mathematical Accuracy',
    consistency: isDE ? 'Konsistenz' : 'Consistency',
    clarity: isDE ? 'Klarheit' : 'Clarity',
    proportionality: isDE ? 'Verhältnismäßigkeit' : 'Proportionality',
    // Tabs
    tabOverview: isDE ? 'Übersicht' : 'Overview',
    tabReconstruction: isDE ? 'Test-Rekonstruktion' : 'Test Reconstruction',
    tabDetails: isDE ? 'Detailanalyse' : 'Detailed Analysis',
    tabRecovery: isDE ? 'Punkte-Rückgewinnung' : 'Point Recovery',
    // Fairness details
    dimensions: isDE ? 'Bewertungsdimensionen' : 'Grading Dimensions',
    detailAnalysis: isDE ? 'Detailanalyse' : 'Detailed Analysis',
    positiveFindings: isDE ? 'Positiv aufgefallen' : 'Positive Findings',
    concerns: isDE ? 'Bedenken' : 'Concerns',
    severityCritical: isDE ? 'Kritisch' : 'Critical',
    severitySignificant: isDE ? 'Wichtig' : 'Significant',
    severityModerate: isDE ? 'Moderat' : 'Moderate',
    severityMinor: isDE ? 'Gering' : 'Minor',
    evidence: isDE ? 'Beleg:' : 'Evidence:',
    pointsAffected: isDE ? 'Betroffene Punkte:' : 'Points affected:',
    gradeBoundaryAnalysis: isDE ? 'Notengrenzen-Analyse' : 'Grade Boundary Analysis',
    currentGrade: isDE ? 'Aktuelle Note' : 'Current Grade',
    achieved: isDE ? 'Erreicht' : 'Achieved',
    recoverable: isDE ? 'Rückgewinnbar' : 'Recoverable',
    gradeChangePossible: isDE ? 'Notenänderung möglich?' : 'Grade change possible?',
    yes: isDE ? 'Ja' : 'Yes',
    no: isDE ? 'Nein' : 'No',
    // Test Reconstruction
    testOverview: isDE ? 'Test-Übersicht (rekonstruiert)' : 'Test Overview (reconstructed)',
    subjectLabel: isDE ? 'Fach' : 'Subject',
    typeLabel: isDE ? 'Art' : 'Type',
    pointsLabel: isDE ? 'Punkte' : 'Points',
    gradeLabel: isDE ? 'Note' : 'Grade',
    pointDiscrepancy: isDE ? 'Punktabweichung gefunden!' : 'Point discrepancy found!',
    taskReconstruction: (count: number) => isDE ? `Aufgaben-Rekonstruktion (${count})` : `Task Reconstruction (${count})`,
    correct: isDE ? 'Korrekt' : 'Correct',
    partial: isDE ? 'Teilweise' : 'Partial',
    wrong: isDE ? 'Falsch' : 'Wrong',
    studentAnswer: isDE ? 'Schülerantwort:' : 'Student answer:',
    teacherCorrection: isDE ? 'Lehrerkorrektur:' : 'Teacher correction:',
    deductionReason: isDE ? 'Abzugsgrund:' : 'Deduction reason:',
    teacherComments: isDE ? 'Lehrerkommentare' : 'Teacher Comments',
    marginNotes: isDE ? 'Randnotizen:' : 'Margin notes:',
    overallTone: isDE ? 'Gesamtton:' : 'Overall tone:',
    toneEncouraging: isDE ? 'Ermutigend' : 'Encouraging',
    toneCritical: isDE ? 'Kritisch' : 'Critical',
    toneMixed: isDE ? 'Gemischt' : 'Mixed',
    toneNeutral: isDE ? 'Neutral' : 'Neutral',
    // Recovery
    potentialRecovery: isDE ? 'Potenzielle Punkte-Rückgewinnung' : 'Potential Point Recovery',
    estimatedPotential: isDE ? 'Geschätztes Potenzial:' : 'Estimated potential:',
    strongArgument: isDE ? 'Starkes Argument' : 'Strong argument',
    moderateArgument: isDE ? 'Moderates Argument' : 'Moderate argument',
    weakArgument: isDE ? 'Schwaches Argument' : 'Weak argument',
    current: isDE ? 'Aktuell:' : 'Current:',
    possible: isDE ? 'Möglich:' : 'Possible:',
    // Recommendation
    recommendation: isDE ? 'Empfehlung' : 'Recommendation',
    contactTeacher: isDE ? 'Gespräch mit Lehrkraft empfohlen' : 'Discussion with teacher recommended',
    noContactNeeded: isDE ? 'Kein Gespräch nötig' : 'No discussion needed',
    urgencyHigh: isDE ? 'Dringend' : 'Urgent',
    urgencyMedium: isDE ? 'Zeitnah' : 'Soon',
    urgencyLow: isDE ? 'Bei Gelegenheit' : 'When convenient',
    conversationOpener: isDE ? 'Gesprächseinstieg:' : 'Conversation opener:',
    talkingPoints: isDE ? 'Gesprächspunkte:' : 'Talking points:',
    avoidThis: isDE ? 'Vermeiden Sie:' : 'Avoid:',
    recoverablePoints: isDE ? 'Möglicherweise erreichbare Punkte:' : 'Potentially recoverable points:',
    disclaimer: isDE ? 'Diese Analyse dient nur zur Orientierung und basiert auf OCR-extrahiertem Text. Im Zweifel sprechen Sie direkt mit der Lehrkraft.' : 'This analysis is for guidance only and is based on OCR-extracted text. When in doubt, speak directly with the teacher.',

    // Learning Material
    learningTitle: isDE ? 'Personalisiertes Lernmaterial' : 'Personalized Learning Material',
    learningDesc: (name: string) => isDE ? `Lektionen, Arbeitsblätter & Quizze für ${name}` : `Lessons, worksheets & quizzes for ${name}`,
    learningLockedTitle: isDE ? 'Personalisiertes Lernmaterial' : 'Personalized Learning Material',
    learningLockedDesc: (name: string) =>
      isDE ? `KI-generierte Lektionen, Arbeitsblätter und Quizze speziell für ${name} – basierend auf dem deutschen Lehrplan` : `AI-generated lessons, worksheets and quizzes tailored for ${name} – based on the German curriculum`,
    generateMaterial: isDE ? 'Lernmaterial generieren' : 'Generate Learning Material',
    generatingMaterial: isDE ? 'Erstelle Material...' : 'Creating material...',
    analyzingTest: isDE ? 'Analysiere Test unabhängig...' : 'Analyzing test independently...',
    materialsCreated: isDE ? 'Materialien erstellt' : 'Materials created',
    learningPlanOverview: isDE ? 'Lernplan-Übersicht' : 'Learning Plan Overview',
    estimatedTime: isDE ? 'Geschätzte Zeit' : 'Estimated Time',
    difficultyLevel: isDE ? 'Schwierigkeitsgrad' : 'Difficulty Level',
    focusAreas: isDE ? 'Schwerpunkte' : 'Focus Areas',
    immediately: isDE ? 'Sofort:' : 'Immediately:',
    thisWeek: isDE ? 'Diese Woche:' : 'This Week:',
    thisMonth: isDE ? 'Diesen Monat:' : 'This Month:',
    weaknessesDetected: isDE ? 'Schwächen erkannt' : 'weaknesses detected',
    curriculumTopicsMatched: isDE ? 'Lehrplan-Themen zugeordnet' : 'curriculum topics matched',
    // Learning tabs
    tabAnalysis: isDE ? 'Analyse' : 'Analysis',
    tabLessons: isDE ? 'Lektionen' : 'Lessons',
    tabWorksheets: isDE ? 'Arbeitsblätter' : 'Worksheets',
    tabQuizzes: isDE ? 'Quizze' : 'Quizzes',
    // Learning analysis
    overallAssessment: isDE ? 'Gesamtbewertung' : 'Overall Assessment',
    detectedWeaknesses: isDE ? 'Erkannte Schwächen' : 'Detected Weaknesses',
    severityLabels: {
      critical: isDE ? 'Kritisch' : 'Critical',
      high: isDE ? 'Hoch' : 'High',
      medium: isDE ? 'Mittel' : 'Medium',
      low: isDE ? 'Gering' : 'Low',
    },
    rootCause: isDE ? 'Ursache:' : 'Root cause:',
    evidenceFromTest: isDE ? 'Beleg aus dem Test:' : 'Evidence from test:',
    teacherFeedbackAnalysis: isDE ? 'Lehrerkommentar-Analyse' : 'Teacher Feedback Analysis',
    mainComments: isDE ? 'Hauptkommentare:' : 'Main comments:',
    correctionPatterns: isDE ? 'Korrekturmuster:' : 'Correction patterns:',
    tone: isDE ? 'Ton:' : 'Tone:',
    recognizedStrengths: isDE ? 'Erkannte Stärken' : 'Recognized Strengths',
    prioritizedNeeds: isDE ? 'Priorisierte Lernbedürfnisse' : 'Prioritized Learning Needs',
    // Lessons
    forTarget: isDE ? 'Für:' : 'For:',
    foundation: isDE ? 'Grundlagen' : 'Foundation',
    building: isDE ? 'Aufbau' : 'Building',
    mastery: isDE ? 'Meisterung' : 'Mastery',
    prerequisiteCheck: isDE ? 'Voraussetzungsprüfung:' : 'Prerequisite Check:',
    expectedAnswer: isDE ? 'Erwartete Antwort:' : 'Expected answer:',
    ifFailed: isDE ? 'Falls nicht bestanden:' : 'If failed:',
    keyRules: isDE ? 'Wichtige Regeln:' : 'Key Rules:',
    example: isDE ? 'Beispiel' : 'Example',
    task: isDE ? 'Aufgabe:' : 'Task:',
    step: isDE ? 'Schritt' : 'Step',
    solution: isDE ? 'Lösung:' : 'Solution:',
    commonMistake: isDE ? 'Häufiger Fehler:' : 'Common mistake:',
    practiceProblems: isDE ? 'Übungsaufgaben:' : 'Practice Problems:',
    hint: isDE ? 'Tipp:' : 'Hint:',
    showAnswer: isDE ? 'Antwort zeigen' : 'Show answer',
    hideAnswer: isDE ? 'Antwort verbergen' : 'Hide answer',
    memoryAids: isDE ? 'Merkhilfen:' : 'Memory Aids:',
    memoryAid: isDE ? 'Merkhilfe:' : 'Memory Aid:',
    inEverydayLife: isDE ? 'Im Alltag:' : 'In everyday life:',
    parentTip: isDE ? 'Tipp für Eltern:' : 'Tip for parents:',
    // Worksheets
    beginner: isDE ? 'Anfänger' : 'Beginner',
    intermediate: isDE ? 'Mittel' : 'Intermediate',
    advanced: isDE ? 'Fortgeschritten' : 'Advanced',
    tasks: isDE ? 'Aufgaben' : 'Tasks',
    taskN: isDE ? 'Aufgabe' : 'Task',
    instructions: isDE ? 'Anleitung' : 'Instructions',
    showSolutions: isDE ? 'Lösungen anzeigen' : 'Show solutions',
    hideSolutions: isDE ? 'Lösungen verbergen' : 'Hide solutions',
    bonusChallenge: isDE ? 'Bonus-Aufgabe:' : 'Bonus Challenge:',
    // Quizzes
    questions: isDE ? 'Fragen' : 'Questions',
    questionN: isDE ? 'Frage' : 'Question',
    passing: isDE ? 'Bestehen:' : 'Passing:',
    scoring: isDE ? 'Bewertung:' : 'Scoring:',
    ifWrong: isDE ? 'Bei Fehler:' : 'If wrong:',
    // Curriculum
    curriculumTopics: isDE ? 'Lehrplan-Themen (Curriculum)' : 'Curriculum Topics',
    // Locked/upgrade
    unlockWithPrime: isDE ? 'Freischalten mit Prime' : 'Unlock with Prime',
    parentsThisWeek: isDE ? 'Eltern diese Woche' : 'parents this week',
    discountToday: isDE ? '-40% heute' : '-40% today',
    upgradeToPrime: isDE ? 'Upgrade to Prime' : 'Upgrade to Prime',
    // Upgrade modal
    unlimitedFlashcards: isDE ? 'Unbegrenzte personalisierte Lernkarten' : 'Unlimited personalized flashcards',
    fairnessCheckFeature: isDE ? 'Fairness-Check für jede Bewertung' : 'Fairness check for every test',
    aiLearningMaterial: isDE ? 'KI-generiertes Lernmaterial (Lektionen, Arbeitsblätter, Quizze)' : 'AI-generated learning material (lessons, worksheets, quizzes)',
    detailedProgress: isDE ? 'Detaillierte Fortschrittsanalysen' : 'Detailed progress analysis',
    prioritySupport: isDE ? 'Prioritäts-Support' : 'Priority support',
    pdfExport: isDE ? 'PDF-Export aller Berichte' : 'PDF export of all reports',
  }
}

// Animated counter for FOMO effect
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number | undefined; suffix?: string | undefined }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration])

  return <span>{count.toLocaleString()}{suffix}</span>
}

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

// Upgrade CTA Button with urgency
export function UpgradeButton({
  variant = 'primary',
  showDiscount = true,
  onClick
}: {
  variant?: 'primary' | 'secondary' | 'minimal' | undefined
  showDiscount?: boolean | undefined
  onClick?: (() => void) | undefined
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl',
    secondary: 'bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50',
    minimal: 'text-amber-600 hover:text-amber-700 underline',
  }

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 flex items-center gap-2`}
    >
      <Crown className="h-5 w-5" />
      <span>Upgrade to Prime</span>
      {showDiscount && variant === 'primary' && (
        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">-40% heute</span>
      )}
    </button>
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
  icon: any
  previewContent?: React.ReactNode | undefined
  stats?: { label: string; value: string }[] | undefined
  onUpgrade?: (() => void) | undefined
}) {
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
              <span className="text-sm font-medium text-gray-700">Freischalten mit Prime</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="flex gap-4 mb-4">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Users className="h-4 w-4" />
          <AnimatedCounter end={FOMO_STATS.upgradesThisWeek} /> Eltern diese Woche
        </div>
        <UpgradeButton variant="primary" onClick={onUpgrade} />
      </div>
    </div>
  )
}

// Flashcards Premium Section
export function FlashcardsPremiumSection({
  isPremium,
  childName,
  analysisData,
  onUpgrade,
  extractedText,
  grade,
  subject,
  schoolType,
  language = 'de',
  uploadId,
  cachedData,
}: IndependentFeatureProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [flashcards, setFlashcards] = useState<any>(cachedData || null)
  const [error, setError] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const t = getPremiumT(language)

  const generateFlashcards = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedText: extractedText || '',
          childName,
          grade: grade || analysisData?.student?.class || 5,
          subject: subject || analysisData?.test?.subject || 'Unknown',
          schoolType: schoolType || 'Gymnasium',
          language,
          uploadId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate flashcards')
      }

      setFlashcards(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorOccurred)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCard = (index: number) => {
    const newFlipped = new Set(flippedCards)
    if (newFlipped.has(index)) {
      newFlipped.delete(index)
    } else {
      newFlipped.add(index)
    }
    setFlippedCards(newFlipped)
  }

  // Free preview cards (show 2 blurred)
  const previewCards = [
    { front: 'Was ist der Unterschied zwischen...?', back: '••••••••••••••••', difficulty: 'medium' },
    { front: 'Erkläre den Begriff...', back: '••••••••••••••••', difficulty: 'easy' },
  ]

  if (!isPremium) {
    return (
      <LockedFeatureTeaser
        title={t.flashcardsLockedTitle}
        description={t.flashcardsLockedDesc(analysisData?.weaknesses?.length || 3, childName || (language === 'de' ? 'Ihr Kind' : 'your child'))}
        icon={BookOpen}
        previewContent={
          <div className="grid grid-cols-2 gap-3">
            {previewCards.map((card, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-700">{card.front}</div>
                <div className="mt-2 text-xs text-gray-400">{card.back}</div>
              </div>
            ))}
          </div>
        }
        stats={[
          { label: t.cardsCreated, value: FOMO_STATS.flashcardsGenerated.toLocaleString() },
          { label: t.gradeImprovement, value: `+${FOMO_STATS.avgGradeImprovement}` },
        ]}
        onUpgrade={onUpgrade}
      />
    )
  }

  // Premium user - full feature
  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-amber-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {t.flashcardsTitle}
              <PremiumBadge size="sm" />
            </h3>
            <p className="text-sm text-gray-600">{t.flashcardsDesc(childName || (language === 'de' ? 'Ihr Kind' : 'your child'))}</p>
          </div>
        </div>

        {!flashcards && (
          <button
            onClick={generateFlashcards}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.generatingCards}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {t.generateCards}
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {flashcards && (
        <div className="space-y-6">
          {/* Study plan */}
          {flashcards.studyPlan && (
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                {t.studyPlan}
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t.dailyGoal}</span>
                  <p className="font-medium">{flashcards.studyPlan.dailyGoal}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t.totalTime}</span>
                  <p className="font-medium">{flashcards.studyPlan.totalTime}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t.reviewSchedule}</span>
                  <p className="font-medium">{flashcards.studyPlan.reviewSchedule}</p>
                </div>
              </div>
            </div>
          )}

          {/* Flashcards grid — always shows both sides; click to highlight answer */}
          <div className="grid md:grid-cols-2 gap-4">
            {flashcards.flashcards?.map((card: any, i: number) => (
              <div
                key={i}
                onClick={() => toggleCard(i)}
                className="cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border-2 border-amber-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500">
                  <span className="text-xs font-bold text-white">
                    {language === 'de' ? 'Karte' : 'Card'} {i + 1}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    card.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    card.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                    'bg-white/20 text-white'
                  }`}>
                    {card.difficulty === 'easy' ? t.easy : card.difficulty === 'hard' ? t.hard : t.medium}
                  </span>
                </div>

                {/* Front — always visible */}
                <div className="bg-white px-4 pt-3 pb-2">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">
                    {language === 'de' ? 'Frage · Vorderseite' : 'Question · Front'}
                  </p>
                  <p className="text-base font-medium text-gray-800">{card.front}</p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 bg-amber-50 px-4 py-1.5 border-y border-amber-200">
                  <div className="flex-1 h-px bg-amber-300" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                    {language === 'de' ? 'Antwort · Rückseite' : 'Answer · Back'}
                  </span>
                  <div className="flex-1 h-px bg-amber-300" />
                </div>

                {/* Back — revealed on click */}
                <div className={`px-4 pt-2 pb-3 transition-all ${
                  flippedCards.has(i)
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : 'bg-amber-50'
                }`}>
                  {flippedCards.has(i) ? (
                    <>
                      <p className="text-base font-medium text-white">{card.back}</p>
                      {card.tip && (
                        <p className="mt-2 text-xs bg-white/15 rounded-lg px-3 py-1.5 text-white/90">
                          {card.tip}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-amber-600 text-center py-1">{t.clickToFlip}</p>
                  )}
                </div>

                {card.forWeakness && (
                  <div className="bg-gray-50 px-4 py-1.5 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      {t.forWeakness} {card.forWeakness}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </button>
            <button
              onClick={() => generateFlashcardsPDF(flashcards, {
                childName,
                subject: analysisData?.test?.subject,
              })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              {t.downloadPDF}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Fairness Check Premium Section
export function FairnessCheckPremiumSection({
  isPremium,
  childName,
  analysisData,
  onUpgrade,
  extractedText,
  grade,
  subject,
  schoolType,
  language = 'de',
  uploadId,
  cachedData,
}: IndependentFeatureProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [fairnessData, setFairnessData] = useState<any>(cachedData || null)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'reconstruction' | 'details' | 'recovery'>('overview')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const t = getPremiumT(language)

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const analyzeFairness = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Use independent fairness API that works from raw text
      const response = await fetch('/api/ai/independent-fairness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedText: extractedText || '',
          childName,
          grade: grade || analysisData?.student?.class || 5,
          subject: subject || analysisData?.test?.subject || 'Unknown',
          schoolType: schoolType || 'Gymnasium',
          language,
          uploadId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze fairness')
      }

      setFairnessData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorOccurred)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'fair': return 'text-green-600 bg-green-50 border-green-200'
      case 'mostly_fair': return 'text-green-600 bg-green-50 border-green-200'
      case 'some_concerns': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'questionable': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'needs_review': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case 'fair': return t.verdictFair
      case 'mostly_fair': return t.verdictMostlyFair
      case 'some_concerns': return t.verdictSomeConcerns
      case 'questionable': return t.verdictQuestionable
      case 'needs_review': return t.verdictNeedsReview
      default: return t.verdictNA
    }
  }

  const getDimensionLabel = (key: string) => {
    const labels: Record<string, string> = {
      gradingConsistency: t.gradingConsistency,
      pointProportionality: t.pointProportionality,
      partialCredit: t.partialCredit,
      clarityOfExpectations: t.clarityOfExpectations,
      feedbackQuality: t.feedbackQuality,
      mathematicalAccuracy: t.mathematicalAccuracy,
      consistency: t.consistency,
      clarity: t.clarity,
      proportionality: t.proportionality,
    }
    return labels[key] || key
  }

  if (!isPremium) {
    return (
      <LockedFeatureTeaser
        title={t.fairnessLockedTitle}
        description={t.fairnessLockedDesc}
        icon={Shield}
        previewContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
              <span className="text-gray-700">{t.fairnessScore}</span>
              <span className="text-2xl font-bold text-gray-400">??%</span>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <span className="text-gray-500">{language === 'de' ? <>Wir haben <strong className="text-amber-600">3 mögliche Bedenken</strong> gefunden...</> : <>We found <strong className="text-amber-600">3 potential concerns</strong>...</>}</span>
            </div>
          </div>
        }
        stats={[
          { label: t.checksPerformed, value: FOMO_STATS.fairnessChecksRun.toLocaleString() },
          { label: t.parentsSatisfied, value: `${FOMO_STATS.parentsSatisfied}%` },
        ]}
        onUpgrade={onUpgrade}
      />
    )
  }

  // Resolve the analysis data - support both independent (new) and old format
  const analysis = fairnessData?.fairnessAnalysis || fairnessData
  const testRecon = fairnessData?.testReconstruction

  // Premium user - full feature
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {t.fairnessTitle}
              <PremiumBadge size="sm" />
            </h3>
            <p className="text-sm text-gray-600">{t.fairnessDesc}</p>
          </div>
        </div>

        {!fairnessData && (
          <button
            onClick={analyzeFairness}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.analyzingIndependently}
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                {t.checkFairness}
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {fairnessData && (
        <div className="space-y-6">
          {/* Independent analysis metadata */}
          {fairnessData.metadata?.isIndependent && (
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">{t.independentAIAnalysis}</p>
                  <p className="text-sm text-blue-600">
                    {fairnessData.metadata.questionsAnalyzed} {t.questionsAnalyzed}
                    {' '}&bull;{' '}
                    {fairnessData.metadata.concernsFound} {t.concernsFound}
                    {' '}&bull;{' '}
                    {t.generatedIn} {fairnessData.metadata.totalGenerationTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main score and verdict */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-blue-200 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{analysis?.overallScore || analysis?.fairnessScore || '—'}%</div>
              <div className="text-gray-600">{t.fairnessScore}</div>
            </div>
            <div className={`rounded-xl p-6 border ${getVerdictColor(analysis?.verdict || '')} text-center`}>
              <div className="text-2xl font-bold mb-2">{getVerdictText(analysis?.verdict || '')}</div>
              <div className="text-sm opacity-80">{analysis?.verdictSummary || analysis?.verdictExplanation || ''}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-blue-200 pb-2 overflow-x-auto">
            {[
              { id: 'overview' as const, label: t.tabOverview },
              ...(testRecon ? [{ id: 'reconstruction' as const, label: t.tabReconstruction }] : []),
              { id: 'details' as const, label: t.tabDetails },
              ...(analysis?.pointRecoveryOpportunities?.length ? [{ id: 'recovery' as const, label: t.tabRecovery }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors text-sm ${
                  activeView === tab.id
                    ? 'bg-white text-blue-600 border border-blue-200 border-b-white -mb-[1px]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeView === 'overview' && (
            <div className="space-y-5">
              {/* Dimension bars */}
              {analysis?.dimensions && (
                <div className="bg-white rounded-xl p-5 border border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-4">{t.dimensions}</h4>
                  <div className="space-y-3">
                    {Object.entries(analysis.dimensions).map(([key, value]: [string, any]) => (
                      <div key={key}>
                        <div className="flex items-center gap-4">
                          <div className="w-44 text-sm text-gray-600">{getDimensionLabel(key)}</div>
                          <div className="flex-1 bg-gray-100 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${value.score >= 80 ? 'bg-green-500' : value.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${value.score}%` }}
                            />
                          </div>
                          <div className="w-12 text-right font-medium">{value.score}%</div>
                        </div>
                        {value.concern && (
                          <p className="text-xs text-amber-600 ml-44 pl-4 mt-1">⚠️ {value.concern}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Old format analysis bars fallback */}
              {!analysis?.dimensions && analysis?.analysis && (
                <div className="bg-white rounded-xl p-5 border border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-4">{t.detailAnalysis}</h4>
                  <div className="space-y-3">
                    {Object.entries(analysis.analysis).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center gap-4">
                        <div className="w-32 text-sm text-gray-600">{getDimensionLabel(key)}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${value.score >= 80 ? 'bg-green-500' : value.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${value.score}%` }}
                          />
                        </div>
                        <div className="w-12 text-right font-medium">{value.score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Positive findings */}
              {analysis?.positiveFindings?.length > 0 && (
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    {t.positiveFindings}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.positiveFindings.map((item: any, i: number) => (
                      <li key={i} className="text-green-700">
                        <span className="font-medium">{item.title || item}</span>
                        {item.detail && <p className="text-sm text-green-600 mt-0.5">{item.detail}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {analysis?.concerns?.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {t.concerns} ({analysis.concerns.length})
                  </h4>
                  <div className="space-y-3">
                    {analysis.concerns.map((concern: any, i: number) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-amber-200">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-gray-800">{concern.title || concern.issue}</span>
                          <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                            concern.severity === 'critical' || concern.severity === 'significant' ? 'bg-red-100 text-red-700' :
                            concern.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {concern.severity === 'critical' ? t.severityCritical :
                             concern.severity === 'significant' ? t.severitySignificant :
                             concern.severity === 'moderate' ? t.severityModerate : t.severityMinor}
                          </span>
                        </div>
                        {concern.detail && <p className="text-sm text-gray-600">{concern.detail}</p>}
                        {concern.evidence && (
                          <p className="text-xs text-gray-500 mt-1 italic">{t.evidence} "{concern.evidence}"</p>
                        )}
                        {concern.pointsAffected && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">{t.pointsAffected} {concern.pointsAffected}</p>
                        )}
                        {concern.recommendation && (
                          <p className="text-xs text-blue-600 mt-1">💡 {concern.recommendation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grade Boundary Analysis */}
              {analysis?.gradeBoundaryAnalysis && (
                <div className="bg-white rounded-xl p-5 border border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {t.gradeBoundaryAnalysis}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.gradeBoundaryAnalysis.currentGrade}</div>
                      <div className="text-xs text-gray-500">{t.currentGrade}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.gradeBoundaryAnalysis.percentage}%</div>
                      <div className="text-xs text-gray-500">{t.achieved}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.gradeBoundaryAnalysis.potentialRecoverablePoints}</div>
                      <div className="text-xs text-gray-500">{t.recoverable}</div>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${analysis.gradeBoundaryAnalysis.couldChangeGrade ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className={`text-2xl font-bold ${analysis.gradeBoundaryAnalysis.couldChangeGrade ? 'text-green-600' : 'text-gray-500'}`}>
                        {analysis.gradeBoundaryAnalysis.couldChangeGrade ? t.yes : t.no}
                      </div>
                      <div className="text-xs text-gray-500">{t.gradeChangePossible}</div>
                    </div>
                  </div>
                  {analysis.gradeBoundaryAnalysis.analysis && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{analysis.gradeBoundaryAnalysis.analysis}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Test Reconstruction Tab */}
          {activeView === 'reconstruction' && testRecon && (
            <div className="space-y-5">
              {/* Test overview */}
              <div className="bg-white rounded-xl p-5 border border-blue-200">
                <h4 className="font-bold text-gray-800 mb-3">{t.testOverview}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{t.subjectLabel}</div>
                    <div className="font-medium">{testRecon.subject || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{t.typeLabel}</div>
                    <div className="font-medium">{testRecon.testType || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{t.pointsLabel}</div>
                    <div className="font-medium">{testRecon.achievedPoints || '?'} / {testRecon.maxPoints || '?'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{t.gradeLabel}</div>
                    <div className="font-medium">{testRecon.gradeGiven || '—'}</div>
                  </div>
                </div>

                {/* Point calculation check */}
                {testRecon.pointCalculationCheck?.discrepancy && (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200 mb-4">
                    <p className="text-sm text-red-700 font-medium">⚠️ {t.pointDiscrepancy}</p>
                    <p className="text-sm text-red-600">
                      {language === 'de' ? 'Lehrer' : 'Teacher'}: {testRecon.pointCalculationCheck.teacherTotal} {t.pointsLabel} &bull;
                      {language === 'de' ? 'Berechnet' : 'Calculated'}: {testRecon.pointCalculationCheck.myCalculatedTotal} {t.pointsLabel}
                    </p>
                    {testRecon.pointCalculationCheck.discrepancyDetails && (
                      <p className="text-xs text-red-500 mt-1">{testRecon.pointCalculationCheck.discrepancyDetails}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Questions breakdown */}
              {testRecon.questions?.length > 0 && (
                <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h4 className="font-bold text-gray-800">{t.taskReconstruction(testRecon.questions.length)}</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {testRecon.questions.map((q: any, i: number) => (
                      <div key={i} className="p-4">
                        <button
                          onClick={() => toggleExpand(`q-${i}`)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              q.isCorrect ? 'bg-green-100 text-green-700' :
                              q.isPartiallyCorrect ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {q.number}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800 text-sm line-clamp-1">{q.questionText}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{q.pointsGiven}/{q.maxPoints} {t.pointsLabel}</span>
                                {q.isCorrect && <span className="text-green-600">✓ {t.correct}</span>}
                                {q.isPartiallyCorrect && <span className="text-amber-600">~ {t.partial}</span>}
                                {!q.isCorrect && !q.isPartiallyCorrect && <span className="text-red-600">✗ {t.wrong}</span>}
                              </div>
                            </div>
                          </div>
                          {expandedItems.has(`q-${i}`) ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        {expandedItems.has(`q-${i}`) && (
                          <div className="mt-3 ml-11 space-y-2 text-sm">
                            {q.studentAnswer && (
                              <div className="bg-gray-50 rounded p-2">
                                <span className="text-xs font-medium text-gray-500">{t.studentAnswer} </span>
                                <span className="text-gray-700">{q.studentAnswer}</span>
                              </div>
                            )}
                            {q.teacherMarks && (
                              <div className="bg-blue-50 rounded p-2">
                                <span className="text-xs font-medium text-blue-600">{t.teacherCorrection} </span>
                                <span className="text-gray-700">{q.teacherMarks}</span>
                              </div>
                            )}
                            {q.deductionReason && (
                              <div className="bg-amber-50 rounded p-2">
                                <span className="text-xs font-medium text-amber-600">{t.deductionReason} </span>
                                <span className="text-gray-700">{q.deductionReason}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher comments */}
              {testRecon.teacherComments && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3">{t.teacherComments}</h4>
                  {testRecon.teacherComments.finalComment && (
                    <blockquote className="border-l-4 border-blue-400 pl-4 py-2 italic text-gray-700 bg-white rounded-r-lg mb-3">
                      "{testRecon.teacherComments.finalComment}"
                    </blockquote>
                  )}
                  {testRecon.teacherComments.marginNotes?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-blue-700">{t.marginNotes}</p>
                      <ul className="text-sm text-gray-600 space-y-1 mt-1">
                        {testRecon.teacherComments.marginNotes.map((note: string, i: number) => (
                          <li key={i}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {testRecon.teacherComments.overallTone && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-blue-700">{t.overallTone}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        testRecon.teacherComments.overallTone === 'encouraging' ? 'bg-green-100 text-green-700' :
                        testRecon.teacherComments.overallTone === 'critical' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {testRecon.teacherComments.overallTone === 'encouraging' ? t.toneEncouraging :
                         testRecon.teacherComments.overallTone === 'critical' ? t.toneCritical :
                         testRecon.teacherComments.overallTone === 'mixed' ? t.toneMixed : t.toneNeutral}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeView === 'details' && (
            <div className="space-y-5">
              {analysis?.dimensions && Object.entries(analysis.dimensions).map(([key, dim]: [string, any]) => (
                <div key={key} className="bg-white rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-800">{getDimensionLabel(key)}</h4>
                    <span className={`text-lg font-bold ${dim.score >= 80 ? 'text-green-600' : dim.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {dim.score}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{dim.finding}</p>
                  {dim.examples?.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {dim.examples.map((ex: string, i: number) => (
                        <p key={i} className="text-xs text-gray-500 bg-gray-50 p-2 rounded">"{ex}"</p>
                      ))}
                    </div>
                  )}
                  {dim.concern && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">⚠️ {dim.concern}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Point Recovery Tab */}
          {activeView === 'recovery' && analysis?.pointRecoveryOpportunities && (
            <div className="space-y-5">
              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t.potentialRecovery}
                </h4>
                <p className="text-lg font-bold text-green-600 mb-4">
                  {t.estimatedPotential} {analysis.totalPotentialRecovery || '—'}
                </p>

                <div className="space-y-3">
                  {analysis.pointRecoveryOpportunities.map((opp: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-gray-800">{opp.question}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          opp.strength === 'strong' ? 'bg-green-100 text-green-700' :
                          opp.strength === 'moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {opp.strength === 'strong' ? t.strongArgument :
                           opp.strength === 'moderate' ? t.moderateArgument : t.weakArgument}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="text-gray-500">{t.current} {opp.currentPoints}P</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600 font-medium">{t.possible} {opp.possiblePoints}P</span>
                        <span className="text-green-500">(+{opp.possiblePoints - opp.currentPoints})</span>
                      </div>
                      <p className="text-sm text-gray-600">{opp.argument}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {analysis?.recommendation && (
            <div className="bg-white rounded-xl p-5 border border-blue-200">
              <h4 className="font-bold text-gray-800 mb-3">{t.recommendation}</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {analysis.recommendation.shouldContactTeacher ? (
                    <span className="flex items-center gap-2 text-blue-600 font-medium">
                      <CheckCircle className="h-5 w-5" />
                      {t.contactTeacher}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle className="h-5 w-5" />
                      {t.noContactNeeded}
                    </span>
                  )}
                  {analysis.recommendation.urgency && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      analysis.recommendation.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      analysis.recommendation.urgency === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {analysis.recommendation.urgency === 'high' ? t.urgencyHigh :
                       analysis.recommendation.urgency === 'medium' ? t.urgencyMedium : t.urgencyLow}
                    </span>
                  )}
                </div>

                {/* Sample opener */}
                {analysis.recommendation.sampleOpener && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs font-medium text-blue-700 mb-1">{t.conversationOpener}</p>
                    <p className="text-sm text-gray-700 italic">"{analysis.recommendation.sampleOpener}"</p>
                  </div>
                )}

                {analysis.recommendation.approach && (
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                    💡 {analysis.recommendation.approach}
                  </p>
                )}
                {(analysis.recommendation.specificPoints || analysis.recommendation.questionsToAsk) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{t.talkingPoints}</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                      {(analysis.recommendation.specificPoints || analysis.recommendation.questionsToAsk || []).map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.recommendation.whatToAvoid?.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">{t.avoidThis}</p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {analysis.recommendation.whatToAvoid.map((item: string, i: number) => (
                        <li key={i}>✕ {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recoverable points (old format fallback) */}
          {!analysis?.gradeBoundaryAnalysis && analysis?.potentialPointsRecoverable && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 flex items-center justify-between">
              <span className="text-green-800">{t.recoverablePoints}</span>
              <span className="text-xl font-bold text-green-600">{analysis.potentialPointsRecoverable}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </button>
            <button
              onClick={() => generateFairnessPDF(fairnessData, {
                childName,
                subject: analysisData?.test?.subject,
              })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              {t.downloadPDF}
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center">
            {analysis?.disclaimer || t.disclaimer}
          </p>
        </div>
      )}
    </div>
  )
}

// Learning Material Premium Section
export function LearningMaterialPremiumSection({
  isPremium,
  childName,
  analysisData,
  onUpgrade,
  extractedText,
  grade,
  subject,
  schoolType,
  language = 'de',
  uploadId,
  cachedData,
}: LearningMaterialProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [learningMaterial, setLearningMaterial] = useState<any>(cachedData || null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'analysis' | 'lessons' | 'worksheets' | 'quizzes'>('analysis')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [generationProgress, setGenerationProgress] = useState<string>('')
  const t = getPremiumT(language)

  const generateLearningMaterial = async () => {
    setIsGenerating(true)
    setError(null)
    setGenerationProgress(t.analyzingTest)

    try {
      // Use the independent learning API that works from raw extracted text
      const response = await fetch('/api/ai/independent-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractedText: extractedText || '',
          childName,
          grade: grade || analysisData?.student?.class || 5,
          subject: subject || analysisData?.test?.subject || 'Unknown',
          schoolType: schoolType || 'Gymnasium',
          language,
          contentTypes: ['lessons', 'worksheets', 'quizzes'],
          uploadId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate learning material')
      }

      setLearningMaterial(data)
      setActiveTab('analysis') // Start with the independent analysis view
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorOccurred)
    } finally {
      setIsGenerating(false)
      setGenerationProgress('')
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  // Preview content for non-premium users
  const previewContent = (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[
          { icon: BookOpen, label: '3 Lektionen', color: 'bg-purple-100 text-purple-600' },
          { icon: FileText, label: '2 Arbeitsblätter', color: 'bg-blue-100 text-blue-600' },
          { icon: ClipboardCheck, label: '1 Quiz', color: 'bg-green-100 text-green-600' },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${item.color}`}>
            <item.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <span className="font-medium text-gray-800">Personalisierter Lernpfad</span>
        </div>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          <div className="h-3 bg-gray-200 rounded w-3/5"></div>
        </div>
      </div>
    </div>
  )

  if (!isPremium) {
    return (
      <LockedFeatureTeaser
        title={t.learningLockedTitle}
        description={t.learningLockedDesc(childName || (language === 'de' ? 'Ihr Kind' : 'your child'))}
        icon={GraduationCap}
        previewContent={previewContent}
        stats={[
          { label: t.materialsCreated, value: FOMO_STATS.learningMaterialsGenerated.toLocaleString() },
          { label: t.gradeImprovement, value: `+${FOMO_STATS.avgGradeImprovement}` },
        ]}
        onUpgrade={onUpgrade}
      />
    )
  }

  // Premium user - full feature
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <GraduationCap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {t.learningTitle}
              <PremiumBadge size="sm" />
            </h3>
            <p className="text-sm text-gray-600">{t.learningDesc(childName || (language === 'de' ? 'Ihr Kind' : 'your child'))}</p>
          </div>
        </div>

        {!learningMaterial && (
          <button
            onClick={generateLearningMaterial}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {generationProgress || t.generatingMaterial}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {t.generateMaterial}
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {learningMaterial && (
        <div className="space-y-6">
          {/* Learning Plan Overview */}
          {learningMaterial.learningPlan?.analysis && (
            <div className="bg-white rounded-xl p-5 border border-purple-200">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                {t.learningPlanOverview}
              </h4>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 mb-1">{t.estimatedTime}</div>
                  <div className="font-bold text-gray-800">{learningMaterial.learningPlan.analysis.estimatedLearningTime}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 mb-1">{t.difficultyLevel}</div>
                  <div className="font-bold text-gray-800 capitalize">{learningMaterial.learningPlan.analysis.difficultyLevel}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 mb-1">{t.focusAreas}</div>
                  <div className="font-bold text-gray-800">{learningMaterial.learningPlan.analysis.primaryWeaknesses?.length || 0}</div>
                </div>
              </div>
              {learningMaterial.learningPlan.learningPath && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 font-medium min-w-[80px]">{t.immediately}</span>
                    <span className="text-gray-600">{learningMaterial.learningPlan.learningPath.immediate}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 font-medium min-w-[80px]">{t.thisWeek}</span>
                    <span className="text-gray-600">{learningMaterial.learningPlan.learningPath.shortTerm}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 font-medium min-w-[80px]">{t.thisMonth}</span>
                    <span className="text-gray-600">{learningMaterial.learningPlan.learningPath.longTerm}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation metadata */}
          {learningMaterial.metadata?.isIndependent && (
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-4 border border-purple-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-800">{t.independentAIAnalysis}</p>
                  <p className="text-sm text-purple-600">
                    {learningMaterial.metadata.weaknessesFound} {t.weaknessesDetected}
                    {' '}&bull;{' '}
                    {learningMaterial.metadata.curriculumTopicsMatched} {t.curriculumTopicsMatched}
                    {' '}&bull;{' '}
                    {t.generatedIn} {learningMaterial.metadata.totalGenerationTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-purple-200 pb-2 overflow-x-auto">
            {[
              ...(learningMaterial.independentAnalysis ? [{ id: 'analysis' as const, icon: Brain, label: t.tabAnalysis, count: learningMaterial.independentAnalysis?.detectedWeaknesses?.length || 0 }] : []),
              { id: 'lessons' as const, icon: BookOpen, label: t.tabLessons, count: learningMaterial.lessons?.lessons?.length || 0 },
              { id: 'worksheets' as const, icon: FileText, label: t.tabWorksheets, count: learningMaterial.worksheets?.worksheets?.length || 0 },
              { id: 'quizzes' as const, icon: ClipboardCheck, label: t.tabQuizzes, count: learningMaterial.quizzes?.quizzes?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 border border-purple-200 border-b-white -mb-[1px]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl border border-purple-200 overflow-hidden">
            {/* Independent Analysis Tab */}
            {activeTab === 'analysis' && learningMaterial.independentAnalysis && (
              <div className="p-5 space-y-5">
                {/* Overall Assessment */}
                {learningMaterial.independentAnalysis.overallAssessment && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {t.overallAssessment}
                    </h4>
                    <p className="text-gray-700">{learningMaterial.independentAnalysis.overallAssessment}</p>
                  </div>
                )}

                {/* Detected Weaknesses */}
                {learningMaterial.independentAnalysis.detectedWeaknesses?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      {t.detectedWeaknesses} ({learningMaterial.independentAnalysis.detectedWeaknesses.length})
                    </h4>
                    <div className="space-y-3">
                      {learningMaterial.independentAnalysis.detectedWeaknesses.map((w: any, i: number) => (
                        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleExpand(`weakness-${i}`)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                w.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                w.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                w.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {w.severity === 'critical' ? t.severityLabels.critical :
                                 w.severity === 'high' ? t.severityLabels.high :
                                 w.severity === 'medium' ? t.severityLabels.medium : t.severityLabels.low}
                              </span>
                              <span className="font-medium text-gray-800">{w.title}</span>
                            </div>
                            {expandedItems.has(`weakness-${i}`) ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          {expandedItems.has(`weakness-${i}`) && (
                            <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                              <p className="text-sm text-gray-700 mt-3">{w.description}</p>
                              {w.rootCause && (
                                <div className="bg-red-50 rounded p-2">
                                  <span className="text-xs font-medium text-red-700">{t.rootCause} </span>
                                  <span className="text-sm text-red-600">{w.rootCause}</span>
                                </div>
                              )}
                              {w.evidenceFromTest && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="text-xs font-medium text-gray-500">{t.evidenceFromTest} </span>
                                  <span className="text-sm text-gray-600 italic">"{w.evidenceFromTest}"</span>
                                </div>
                              )}
                              {w.affectedSkills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {w.affectedSkills.map((skill: string, j: number) => (
                                    <span key={j} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{skill}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher Feedback Analysis */}
                {learningMaterial.independentAnalysis.teacherFeedback && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      {t.teacherFeedbackAnalysis}
                    </h4>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
                      {learningMaterial.independentAnalysis.teacherFeedback.mainComments?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-1">{t.mainComments}</p>
                          <ul className="space-y-1">
                            {learningMaterial.independentAnalysis.teacherFeedback.mainComments.map((c: string, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">&#8226;</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {learningMaterial.independentAnalysis.teacherFeedback.correctionPatterns?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-1">{t.correctionPatterns}</p>
                          <ul className="space-y-1">
                            {learningMaterial.independentAnalysis.teacherFeedback.correctionPatterns.map((p: string, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">&#8226;</span> {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {learningMaterial.independentAnalysis.teacherFeedback.overallTone && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-800">{t.tone}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'encouraging' ? 'bg-green-100 text-green-700' :
                            learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'critical' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'encouraging' ? t.toneEncouraging :
                             learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'critical' ? t.toneCritical :
                             learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'mixed' ? t.toneMixed : t.toneNeutral}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Strengths found */}
                {learningMaterial.independentAnalysis.strengths?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      {t.recognizedStrengths}
                    </h4>
                    <div className="space-y-2">
                      {learningMaterial.independentAnalysis.strengths.map((s: any, i: number) => (
                        <div key={i} className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="font-medium text-green-800">{s.title}</p>
                          {s.evidence && (
                            <p className="text-sm text-green-600 mt-1">{t.evidence} {s.evidence}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prioritized Learning Needs */}
                {learningMaterial.independentAnalysis.prioritizedLearningNeeds?.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t.prioritizedNeeds}
                    </h4>
                    <ol className="space-y-2">
                      {learningMaterial.independentAnalysis.prioritizedLearningNeeds.map((need: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-sm font-bold">
                            {i + 1}
                          </span>
                          <span className="text-gray-700">{need}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Lessons Tab */}
            {activeTab === 'lessons' && learningMaterial.lessons?.lessons && (
              <div className="divide-y divide-gray-100">
                {learningMaterial.lessons.lessons.map((lesson: any, i: number) => (
                  <div key={i} className="p-4">
                    <button
                      onClick={() => toggleExpand(`lesson-${i}`)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <PlayCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800">{lesson.title}</h5>
                          <p className="text-sm text-gray-500">{t.forTarget} {lesson.targetWeakness}</p>
                        </div>
                      </div>
                      {expandedItems.has(`lesson-${i}`) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {expandedItems.has(`lesson-${i}`) && (
                      <div className="mt-4 space-y-4 pl-14">
                        {/* Difficulty & Time */}
                        {(lesson.difficulty || lesson.estimatedTime) && (
                          <div className="flex gap-2">
                            {lesson.difficulty && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                lesson.difficulty === 'foundation' ? 'bg-green-100 text-green-700' :
                                lesson.difficulty === 'mastery' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {lesson.difficulty === 'foundation' ? t.foundation :
                                 lesson.difficulty === 'mastery' ? t.mastery : t.building}
                              </span>
                            )}
                            {lesson.estimatedTime && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                ⏱️ {lesson.estimatedTime}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Prerequisite Check - support both old and new format */}
                        {lesson.prerequisiteCheck && (
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <div className="text-sm font-medium text-amber-700 mb-1">📝 {t.prerequisiteCheck}</div>
                            <p className="text-sm text-amber-600">
                              {typeof lesson.prerequisiteCheck === 'string'
                                ? lesson.prerequisiteCheck
                                : lesson.prerequisiteCheck.question}
                            </p>
                            {lesson.prerequisiteCheck.expectedAnswer && (
                              <p className="text-xs text-amber-500 mt-1">{t.expectedAnswer} {lesson.prerequisiteCheck.expectedAnswer}</p>
                            )}
                            {lesson.prerequisiteCheck.ifFailed && (
                              <p className="text-xs text-red-500 mt-1">{t.ifFailed} {lesson.prerequisiteCheck.ifFailed}</p>
                            )}
                          </div>
                        )}

                        {/* Introduction (new format) */}
                        {lesson.content?.introduction && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <p className="text-sm text-purple-700">{lesson.content.introduction}</p>
                          </div>
                        )}

                        {/* Explanation - support both old and new format */}
                        <div className="prose prose-sm max-w-none">
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {lesson.content?.explanation || lesson.explanation}
                          </div>
                        </div>

                        {/* Key Rules / Key Points */}
                        {(lesson.content?.keyRules || lesson.keyPoints) && (
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-purple-700 mb-2">🔑 {t.keyRules}</div>
                            <ul className="space-y-1">
                              {(lesson.content?.keyRules || lesson.keyPoints).map((point: string, j: number) => (
                                <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                                  <Check className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Worked Examples (new format) */}
                        {lesson.content?.workedExamples?.map((example: any, j: number) => (
                          <div key={j} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="text-sm font-medium text-blue-700 mb-2">📖 {t.example} {j + 1}:</div>
                            <p className="text-sm text-gray-700 mb-2"><strong>{t.task}</strong> {example.problem}</p>
                            <div className="space-y-1 mb-2">
                              {example.steps?.map((step: string, k: number) => (
                                <p key={k} className="text-sm text-gray-600">
                                  <span className="font-medium">{t.step} {k + 1}:</span> {step}
                                </p>
                              ))}
                            </div>
                            <p className="text-sm text-green-700"><strong>{t.solution}</strong> {example.solution}</p>
                            {example.commonMistake && (
                              <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                                ⚠️ {t.commonMistake} {example.commonMistake}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* Example Walkthrough (old format fallback) */}
                        {!lesson.content?.workedExamples && lesson.exampleWalkthrough && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="text-sm font-medium text-blue-700 mb-2">📖 {t.example}:</div>
                            <p className="text-sm text-gray-700 mb-2"><strong>{t.task}</strong> {lesson.exampleWalkthrough.problem}</p>
                            <div className="space-y-1 mb-2">
                              {lesson.exampleWalkthrough.steps?.map((step: string, j: number) => (
                                <p key={j} className="text-sm text-gray-600">
                                  <span className="font-medium">{t.step} {j + 1}:</span> {step}
                                </p>
                              ))}
                            </div>
                            <p className="text-sm text-green-700"><strong>{t.solution}</strong> {lesson.exampleWalkthrough.solution}</p>
                          </div>
                        )}

                        {/* Practice Problems (new format) */}
                        {lesson.content?.practiceProblems?.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="text-sm font-medium text-green-700 mb-2">✏️ {t.practiceProblems}</div>
                            <div className="space-y-2">
                              {lesson.content.practiceProblems.map((prob: any, j: number) => (
                                <div key={j} className="bg-white rounded p-2 border border-green-100">
                                  <p className="text-sm text-gray-700">{j + 1}. {prob.question}</p>
                                  {prob.hint && (
                                    <p className="text-xs text-amber-600 mt-1">💡 {t.hint} {prob.hint}</p>
                                  )}
                                  <button
                                    onClick={() => toggleExpand(`practice-${i}-${j}`)}
                                    className="text-xs text-blue-600 hover:underline mt-1"
                                  >
                                    {expandedItems.has(`practice-${i}-${j}`) ? t.hideAnswer : t.showAnswer}
                                  </button>
                                  {expandedItems.has(`practice-${i}-${j}`) && (
                                    <p className="text-sm text-green-700 mt-1 bg-green-50 p-1 rounded">✅ {prob.answer}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Memory Aids (new format) */}
                        {lesson.memoryAids && (
                          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 space-y-2">
                            <div className="text-sm font-medium text-yellow-700">💡 {t.memoryAids}</div>
                            {lesson.memoryAids.mnemonic && (
                              <p className="text-sm text-gray-600">🧠 {lesson.memoryAids.mnemonic}</p>
                            )}
                            {lesson.memoryAids.visualAid && (
                              <p className="text-sm text-gray-600">📊 {lesson.memoryAids.visualAid}</p>
                            )}
                            {lesson.memoryAids.realWorldExample && (
                              <p className="text-sm text-gray-600">🌍 {lesson.memoryAids.realWorldExample}</p>
                            )}
                          </div>
                        )}

                        {/* Memory Trick (old format fallback) */}
                        {!lesson.memoryAids && lesson.memoryTrick && (
                          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                            <div className="text-sm font-medium text-yellow-700">💡 {t.memoryAid}</div>
                            <p className="text-sm text-gray-600">{lesson.memoryTrick}</p>
                          </div>
                        )}

                        {/* Real World Connection (old format fallback) */}
                        {!lesson.memoryAids && lesson.realWorldConnection && (
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">🌍 {t.inEverydayLife}</span> {lesson.realWorldConnection}
                          </div>
                        )}

                        {/* Parent Guidance (new format) */}
                        {lesson.parentGuidance && (
                          <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                            <div className="text-sm font-medium text-pink-700 mb-1">👨‍👩‍👧 {t.parentTip}</div>
                            <p className="text-sm text-gray-600">{lesson.parentGuidance}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Worksheets Tab */}
            {activeTab === 'worksheets' && learningMaterial.worksheets?.worksheets && (
              <div className="divide-y divide-gray-100">
                {learningMaterial.worksheets.worksheets.map((worksheet: any, i: number) => (
                  <div key={i} className="p-4">
                    <button
                      onClick={() => toggleExpand(`worksheet-${i}`)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800">{worksheet.title}</h5>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              worksheet.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                              worksheet.difficulty === 'advanced' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {worksheet.difficulty === 'beginner' ? t.beginner :
                               worksheet.difficulty === 'advanced' ? t.advanced : t.intermediate}
                            </span>
                            <span>• {worksheet.estimatedTime}</span>
                            <span>• {worksheet.problems?.length || 0} {t.tasks}</span>
                          </div>
                        </div>
                      </div>
                      {expandedItems.has(`worksheet-${i}`) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {expandedItems.has(`worksheet-${i}`) && (
                      <div className="mt-4 pl-14 space-y-4">
                        {/* Instructions */}
                        {worksheet.instructions && (
                          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                            {worksheet.instructions}
                          </div>
                        )}

                        {/* Problems */}
                        <div className="space-y-3">
                          {worksheet.problems?.map((problem: any, j: number) => (
                            <div key={j} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <span className="font-medium text-gray-800">{t.taskN} {problem.number}</span>
                                <span className="text-xs text-gray-400">{problem.points} {t.pointsLabel}</span>
                              </div>
                              <p className="text-gray-700 mb-2">{problem.question}</p>

                              {/* Multiple choice options */}
                              {problem.options && (
                                <div className="space-y-1 ml-4">
                                  {problem.options.map((opt: string, k: number) => (
                                    <div key={k} className="flex items-center gap-2 text-sm text-gray-600">
                                      <div className="w-5 h-5 rounded-full border border-gray-300"></div>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Hint */}
                              {problem.hint && (
                                <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                  💡 {t.hint} {problem.hint}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Answer Key (collapsible) */}
                        {worksheet.answerKey && (
                          <div className="mt-4">
                            <button
                              onClick={() => toggleExpand(`answers-${i}`)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              {expandedItems.has(`answers-${i}`) ? t.hideSolutions : t.showSolutions}
                              {expandedItems.has(`answers-${i}`) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            {expandedItems.has(`answers-${i}`) && (
                              <div className="mt-2 bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="space-y-2">
                                  {worksheet.answerKey.map((ans: any, j: number) => (
                                    <div key={j} className="text-sm">
                                      <span className="font-medium text-gray-700">{t.taskN} {ans.number}:</span>{' '}
                                      <span className="text-green-700">{ans.answer}</span>
                                      {ans.explanation && (
                                        <span className="text-gray-500"> – {ans.explanation}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bonus Challenge */}
                        {worksheet.bonusChallenge && (
                          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                            <div className="text-sm font-medium text-purple-700 mb-1">⭐ {t.bonusChallenge}</div>
                            <p className="text-sm text-gray-700">{worksheet.bonusChallenge.question}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quizzes Tab */}
            {activeTab === 'quizzes' && learningMaterial.quizzes?.quizzes && (
              <div className="divide-y divide-gray-100">
                {learningMaterial.quizzes.quizzes.map((quiz: any, i: number) => (
                  <div key={i} className="p-4">
                    <button
                      onClick={() => toggleExpand(`quiz-${i}`)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ClipboardCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-800">{quiz.title}</h5>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>⏱️ {quiz.timeLimit}</span>
                            <span>• {quiz.questions?.length || 0} {t.questions}</span>
                            <span>• {t.passing} {quiz.passingScore}%</span>
                          </div>
                        </div>
                      </div>
                      {expandedItems.has(`quiz-${i}`) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {expandedItems.has(`quiz-${i}`) && (
                      <div className="mt-4 pl-14 space-y-4">
                        {/* Quiz Questions */}
                        <div className="space-y-3">
                          {quiz.questions?.map((q: any, j: number) => (
                            <div key={j} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <span className="font-medium text-gray-800">{t.questionN} {q.number}</span>
                                <span className="text-xs text-gray-400">{q.points} {t.pointsLabel}</span>
                              </div>
                              <p className="text-gray-700 mb-3">{q.question}</p>

                              {/* Options */}
                              {q.options && (
                                <div className="space-y-2 ml-2">
                                  {q.options.map((opt: string, k: number) => (
                                    <div key={k} className="flex items-center gap-2 text-sm">
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                        opt === q.correctAnswer ? 'border-green-500 bg-green-50' : 'border-gray-300'
                                      }`}>
                                        {opt === q.correctAnswer && <Check className="h-3 w-3 text-green-500" />}
                                      </div>
                                      <span className={opt === q.correctAnswer ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                        {opt}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Feedback */}
                              <div className="mt-3 grid md:grid-cols-2 gap-2 text-xs">
                                {q.commonMistake && (
                                  <div className="bg-amber-50 p-2 rounded text-amber-700">
                                    ⚠️ {t.commonMistake} {q.commonMistake}
                                  </div>
                                )}
                                {q.feedbackIfWrong && (
                                  <div className="bg-red-50 p-2 rounded text-red-700">
                                    ❌ {t.ifWrong} {q.feedbackIfWrong}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Scoring Guide */}
                        {quiz.scoringGuide && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">📊 {t.scoring}</div>
                            <div className="space-y-1 text-sm">
                              <div className="text-green-600">{quiz.scoringGuide.excellent}</div>
                              <div className="text-amber-600">{quiz.scoringGuide.good}</div>
                              <div className="text-red-600">{quiz.scoringGuide.needsWork}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curriculum Topics Used */}
          {learningMaterial.curriculumTopics && learningMaterial.curriculumTopics.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-purple-600" />
                {t.curriculumTopics}
              </h4>
              <div className="flex flex-wrap gap-2">
                {learningMaterial.curriculumTopics.map((topic: any, i: number) => (
                  <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {topic.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              {t.print}
            </button>
            <button
              onClick={() => generateLearningMaterialPDF(learningMaterial, {
                childName,
                subject: analysisData?.test?.subject,
              })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              {t.downloadPDF}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Upgrade Modal with FOMO
export function UpgradeModal({
  isOpen,
  onClose,
  feature,
}: {
  isOpen: boolean
  onClose: () => void
  feature?: 'flashcards' | 'fairness' | 'learning' | undefined
}) {
  if (!isOpen) return null

  const features = [
    { icon: BookOpen, text: 'Unbegrenzte personalisierte Lernkarten' },
    { icon: Shield, text: 'Fairness-Check für jede Bewertung' },
    { icon: GraduationCap, text: 'KI-generiertes Lernmaterial (Lektionen, Arbeitsblätter, Quizze)' },
    { icon: TrendingUp, text: 'Detaillierte Fortschrittsanalysen' },
    { icon: Sparkles, text: 'Prioritäts-Support' },
    { icon: Download, text: 'PDF-Export aller Berichte' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <Crown className="h-10 w-10" />
            <div>
              <h2 className="text-2xl font-bold">GradeAI Prime</h2>
              <p className="opacity-90">Das Beste für Ihr Kind</p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-lg p-3 text-center">
            <span className="text-3xl font-bold">€9.99</span>
            <span className="text-lg">/Monat</span>
            <span className="ml-3 line-through opacity-70">€16.99</span>
            <span className="ml-2 bg-white text-amber-600 px-2 py-0.5 rounded text-sm font-bold">-40%</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Urgency banner */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Angebot endet bald!</p>
              <p className="text-sm text-red-600">Nur noch 23:47:12 verbleibend</p>
            </div>
          </div>

          {/* Features list */}
          <ul className="space-y-3 mb-6">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <f.icon className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-gray-700">{f.text}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 border-2 border-white" />
                ))}
              </div>
              <span className="text-sm text-gray-600">+<AnimatedCounter end={FOMO_STATS.upgradesThisWeek} /> diese Woche</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
              ))}
              <span className="text-sm text-gray-600 ml-2">{FOMO_STATS.parentsSatisfied}% zufriedene Eltern</span>
            </div>
          </div>

          {/* CTA buttons */}
          <button className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
            <Gift className="h-5 w-5" />
            Jetzt Prime werden
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Jederzeit kündbar • 30 Tage Geld-zurück-Garantie
          </p>
        </div>
      </div>
    </div>
  )
}
