'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
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
import { useLanguage } from '@/components/providers/LanguageProvider'
import { getPremiumTranslation } from './premiumTranslations'

// Languages that don't render correctly in jsPDF (non-Latin scripts)
const NON_LATIN_LANGS = ['ar', 'fa', 'ku', 'kmr']

// Print only a specific section — sets a body attribute so CSS can isolate it
function printSectionOnly(section: 'flashcards' | 'fairness') {
  document.body.setAttribute('data-printing', section)
  window.print()
  const cleanup = () => {
    document.body.removeAttribute('data-printing')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
}

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

// UI chrome translations for premium features – supports all 9 app languages
function getPremiumT(lang: string = 'de') {
  // English base – fallback for all languages
  const en = {
    flashcardsTitle: 'Personalized Flashcards',
    flashcardsDesc: (name: string) => `Tailored for ${name}`,
    generateCards: 'Generate Flashcards',
    generatingCards: 'Creating cards...',
    studyPlan: 'Study Plan',
    dailyGoal: 'Daily Goal:',
    totalTime: 'Total Time:',
    reviewSchedule: 'Review:',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    clickToFlip: 'Click to flip',
    cardLabel: 'Card',
    questionFront: 'Question · Front',
    answerBack: 'Answer · Back',
    forWeakness: 'For:',
    answer: 'Answer',
    print: 'Print',
    downloadPDF: 'Download PDF',
    errorOccurred: 'An error occurred',
    flashcardsLockedTitle: 'Personalized Flashcards',
    flashcardsLockedDesc: (count: number, name: string) => `${count}+ flashcards tailored for ${name} based on test weaknesses`,
    cardsCreated: 'Cards created',
    gradeImprovement: 'Grade improvement',
    fairnessTitle: 'Fairness Check',
    fairnessDesc: 'Independent grading analysis',
    fairnessLockedTitle: 'Grading Fairness Check',
    fairnessLockedDesc: 'Was your child graded fairly? AI analysis with actionable recommendations',
    checkFairness: 'Check Fairness',
    analyzingIndependently: 'Analyzing independently...',
    independentAIAnalysis: 'Independent AI Analysis',
    questionsAnalyzed: 'questions analyzed',
    concernsFound: 'concerns found',
    generatedIn: 'Generated in',
    fairnessScore: 'Fairness Score',
    checksPerformed: 'Checks performed',
    parentsSatisfied: 'Parents satisfied',
    verdictFair: 'Grading is fair',
    verdictMostlyFair: 'Mostly fair',
    verdictSomeConcerns: 'Some concerns',
    verdictQuestionable: 'Questionable',
    verdictNeedsReview: 'Review recommended',
    verdictNA: 'Not assessable',
    gradingConsistency: 'Grading Consistency',
    pointProportionality: 'Point Proportionality',
    partialCredit: 'Partial Credit',
    clarityOfExpectations: 'Clarity of Expectations',
    feedbackQuality: 'Feedback Quality',
    mathematicalAccuracy: 'Mathematical Accuracy',
    consistency: 'Consistency',
    clarity: 'Clarity',
    proportionality: 'Proportionality',
    tabOverview: 'Overview',
    tabReconstruction: 'Test Reconstruction',
    tabDetails: 'Detailed Analysis',
    tabRecovery: 'Point Recovery',
    dimensions: 'Grading Dimensions',
    detailAnalysis: 'Detailed Analysis',
    positiveFindings: 'Positive Findings',
    concerns: 'Concerns',
    severityCritical: 'Critical',
    severitySignificant: 'Significant',
    severityModerate: 'Moderate',
    severityMinor: 'Minor',
    evidence: 'Evidence:',
    pointsAffected: 'Points affected:',
    gradeBoundaryAnalysis: 'Grade Boundary Analysis',
    currentGrade: 'Current Grade',
    achieved: 'Achieved',
    recoverable: 'Recoverable',
    gradeChangePossible: 'Grade change possible?',
    yes: 'Yes',
    no: 'No',
    testOverview: 'Test Overview (reconstructed)',
    subjectLabel: 'Subject',
    typeLabel: 'Type',
    pointsLabel: 'Points',
    gradeLabel: 'Grade',
    pointDiscrepancy: 'Point discrepancy found!',
    taskReconstruction: (count: number) => `Task Reconstruction (${count})`,
    correct: 'Correct',
    partial: 'Partial',
    wrong: 'Wrong',
    studentAnswer: 'Student answer:',
    teacherCorrection: 'Teacher correction:',
    deductionReason: 'Deduction reason:',
    teacherComments: 'Teacher Comments',
    marginNotes: 'Margin notes:',
    overallTone: 'Overall tone:',
    toneEncouraging: 'Encouraging',
    toneCritical: 'Critical',
    toneMixed: 'Mixed',
    toneNeutral: 'Neutral',
    potentialRecovery: 'Potential Point Recovery',
    estimatedPotential: 'Estimated potential:',
    strongArgument: 'Strong argument',
    moderateArgument: 'Moderate argument',
    weakArgument: 'Weak argument',
    current: 'Current:',
    possible: 'Possible:',
    recommendation: 'Recommendation',
    contactTeacher: 'Discussion with teacher recommended',
    noContactNeeded: 'No discussion needed',
    urgencyHigh: 'Urgent',
    urgencyMedium: 'Soon',
    urgencyLow: 'When convenient',
    conversationOpener: 'Conversation opener:',
    talkingPoints: 'Talking points:',
    avoidThis: 'Avoid:',
    recoverablePoints: 'Potentially recoverable points:',
    disclaimer: 'This analysis is for guidance only and is based on OCR-extracted text. When in doubt, speak directly with the teacher.',
    learningTitle: 'Personalized Learning Material',
    learningDesc: (name: string) => `Lessons, worksheets & quizzes for ${name}`,
    learningLockedTitle: 'Personalized Learning Material',
    learningLockedDesc: (name: string) => `AI-generated lessons, worksheets and quizzes tailored for ${name} – based on the German curriculum`,
    generateMaterial: 'Generate Learning Material',
    generatingMaterial: 'Creating material...',
    analyzingTest: 'Analyzing test independently...',
    materialsCreated: 'Materials created',
    learningPlanOverview: 'Learning Plan Overview',
    estimatedTime: 'Estimated Time',
    difficultyLevel: 'Difficulty Level',
    focusAreas: 'Focus Areas',
    immediately: 'Immediately:',
    thisWeek: 'This Week:',
    thisMonth: 'This Month:',
    weaknessesDetected: 'weaknesses detected',
    curriculumTopicsMatched: 'curriculum topics matched',
    tabAnalysis: 'Analysis',
    tabLessons: 'Lessons',
    tabWorksheets: 'Worksheets',
    tabQuizzes: 'Quizzes',
    overallAssessment: 'Overall Assessment',
    detectedWeaknesses: 'Detected Weaknesses',
    severityLabels: { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' },
    rootCause: 'Root cause:',
    evidenceFromTest: 'Evidence from test:',
    teacherFeedbackAnalysis: 'Teacher Feedback Analysis',
    mainComments: 'Main comments:',
    correctionPatterns: 'Correction patterns:',
    tone: 'Tone:',
    recognizedStrengths: 'Recognized Strengths',
    prioritizedNeeds: 'Prioritized Learning Needs',
    forTarget: 'For:',
    foundation: 'Foundation',
    building: 'Building',
    mastery: 'Mastery',
    prerequisiteCheck: 'Prerequisite Check:',
    expectedAnswer: 'Expected answer:',
    ifFailed: 'If failed:',
    keyRules: 'Key Rules:',
    example: 'Example',
    task: 'Task:',
    step: 'Step',
    solution: 'Solution:',
    commonMistake: 'Common mistake:',
    practiceProblems: 'Practice Problems:',
    hint: 'Hint:',
    showAnswer: 'Show answer',
    hideAnswer: 'Hide answer',
    memoryAids: 'Memory Aids:',
    memoryAid: 'Memory Aid:',
    inEverydayLife: 'In everyday life:',
    parentTip: 'Tip for parents:',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    tasks: 'Tasks',
    taskN: 'Task',
    instructions: 'Instructions',
    showSolutions: 'Show solutions',
    hideSolutions: 'Hide solutions',
    bonusChallenge: 'Bonus Challenge:',
    questions: 'Questions',
    questionN: 'Question',
    passing: 'Passing:',
    scoring: 'Scoring:',
    ifWrong: 'If wrong:',
    curriculumTopics: 'Curriculum Topics',
    unlockWithPrime: 'Unlock with Prime',
    parentsThisWeek: 'parents this week',
    discountToday: '-40% today',
    upgradeToPrime: 'Upgrade to Prime',
    unlimitedFlashcards: 'Unlimited personalized flashcards',
    fairnessCheckFeature: 'Fairness check for every test',
    aiLearningMaterial: 'AI-generated learning material (lessons, worksheets, quizzes)',
    detailedProgress: 'Detailed progress analysis',
    prioritySupport: 'Priority support',
    pdfExport: 'PDF export of all reports',
    yourChild: 'your child',
    teacherLabel: 'Teacher',
    calculatedLabel: 'Calculated',
  }

  // Per-language overrides – only keys that differ from English
  const overrides: Record<string, Partial<typeof en>> = {
    de: {
      flashcardsTitle: 'Personalisierte Lernkarten',
      flashcardsDesc: (name: string) => `Maßgeschneidert für ${name}`,
      generateCards: 'Lernkarten generieren',
      generatingCards: 'Erstelle Karten...',
      studyPlan: 'Lernplan',
      dailyGoal: 'Tägliches Ziel:',
      totalTime: 'Gesamtzeit:',
      reviewSchedule: 'Wiederholung:',
      easy: 'Leicht',
      medium: 'Mittel',
      hard: 'Schwer',
      clickToFlip: 'Klicken zum Umdrehen',
      cardLabel: 'Karte',
      questionFront: 'Frage · Vorderseite',
      answerBack: 'Antwort · Rückseite',
      answer: 'Antwort',
      print: 'Drucken',
      downloadPDF: 'PDF herunterladen',
      errorOccurred: 'Ein Fehler ist aufgetreten',
      flashcardsLockedTitle: 'Personalisierte Lernkarten',
      flashcardsLockedDesc: (count: number, name: string) => `${count}+ Lernkarten speziell für ${name} basierend auf den Testschwächen`,
      cardsCreated: 'Karten erstellt',
      gradeImprovement: 'Notenverbesserung',
      fairnessTitle: 'Fairness-Check',
      fairnessDesc: 'Unabhängige Analyse der Bewertung',
      fairnessLockedTitle: 'Fairness-Check der Bewertung',
      fairnessLockedDesc: 'Wurde Ihr Kind fair bewertet? KI-Analyse der Benotung mit konkreten Handlungsempfehlungen',
      checkFairness: 'Fairness prüfen',
      analyzingIndependently: 'Analysiere unabhängig...',
      independentAIAnalysis: 'Unabhängige KI-Analyse',
      questionsAnalyzed: 'Aufgaben analysiert',
      concernsFound: 'Bedenken gefunden',
      generatedIn: 'Generiert in',
      fairnessScore: 'Fairness-Score',
      checksPerformed: 'Checks durchgeführt',
      parentsSatisfied: 'Eltern zufrieden',
      verdictFair: 'Bewertung ist fair',
      verdictMostlyFair: 'Überwiegend fair',
      verdictSomeConcerns: 'Einige Bedenken',
      verdictQuestionable: 'Fragwürdig',
      verdictNeedsReview: 'Überprüfung empfohlen',
      verdictNA: 'Nicht bewertbar',
      gradingConsistency: 'Bewertungskonsistenz',
      pointProportionality: 'Punktverhältnismäßigkeit',
      partialCredit: 'Teilpunkte-Vergabe',
      clarityOfExpectations: 'Klarheit der Erwartungen',
      feedbackQuality: 'Feedback-Qualität',
      mathematicalAccuracy: 'Rechnerische Korrektheit',
      consistency: 'Konsistenz',
      clarity: 'Klarheit',
      proportionality: 'Verhältnismäßigkeit',
      tabOverview: 'Übersicht',
      tabReconstruction: 'Test-Rekonstruktion',
      tabDetails: 'Detailanalyse',
      tabRecovery: 'Punkte-Rückgewinnung',
      dimensions: 'Bewertungsdimensionen',
      detailAnalysis: 'Detailanalyse',
      positiveFindings: 'Positiv aufgefallen',
      concerns: 'Bedenken',
      severityCritical: 'Kritisch',
      severitySignificant: 'Wichtig',
      severityModerate: 'Moderat',
      severityMinor: 'Gering',
      evidence: 'Beleg:',
      pointsAffected: 'Betroffene Punkte:',
      gradeBoundaryAnalysis: 'Notengrenzen-Analyse',
      currentGrade: 'Aktuelle Note',
      achieved: 'Erreicht',
      recoverable: 'Rückgewinnbar',
      gradeChangePossible: 'Notenänderung möglich?',
      yes: 'Ja',
      no: 'Nein',
      testOverview: 'Test-Übersicht (rekonstruiert)',
      subjectLabel: 'Fach',
      typeLabel: 'Art',
      pointsLabel: 'Punkte',
      gradeLabel: 'Note',
      pointDiscrepancy: 'Punktabweichung gefunden!',
      taskReconstruction: (count: number) => `Aufgaben-Rekonstruktion (${count})`,
      correct: 'Korrekt',
      partial: 'Teilweise',
      wrong: 'Falsch',
      studentAnswer: 'Schülerantwort:',
      teacherCorrection: 'Lehrerkorrektur:',
      deductionReason: 'Abzugsgrund:',
      teacherComments: 'Lehrerkommentare',
      marginNotes: 'Randnotizen:',
      overallTone: 'Gesamtton:',
      toneEncouraging: 'Ermutigend',
      toneCritical: 'Kritisch',
      toneMixed: 'Gemischt',
      toneNeutral: 'Neutral',
      potentialRecovery: 'Potenzielle Punkte-Rückgewinnung',
      estimatedPotential: 'Geschätztes Potenzial:',
      strongArgument: 'Starkes Argument',
      moderateArgument: 'Moderates Argument',
      weakArgument: 'Schwaches Argument',
      current: 'Aktuell:',
      possible: 'Möglich:',
      recommendation: 'Empfehlung',
      contactTeacher: 'Gespräch mit Lehrkraft empfohlen',
      noContactNeeded: 'Kein Gespräch nötig',
      urgencyHigh: 'Dringend',
      urgencyMedium: 'Zeitnah',
      urgencyLow: 'Bei Gelegenheit',
      conversationOpener: 'Gesprächseinstieg:',
      talkingPoints: 'Gesprächspunkte:',
      avoidThis: 'Vermeiden Sie:',
      recoverablePoints: 'Möglicherweise erreichbare Punkte:',
      disclaimer: 'Diese Analyse dient nur zur Orientierung und basiert auf OCR-extrahiertem Text. Im Zweifel sprechen Sie direkt mit der Lehrkraft.',
      learningTitle: 'Personalisiertes Lernmaterial',
      learningDesc: (name: string) => `Lektionen, Arbeitsblätter & Quizze für ${name}`,
      learningLockedTitle: 'Personalisiertes Lernmaterial',
      learningLockedDesc: (name: string) => `KI-generierte Lektionen, Arbeitsblätter und Quizze speziell für ${name} – basierend auf dem deutschen Lehrplan`,
      generateMaterial: 'Lernmaterial generieren',
      generatingMaterial: 'Erstelle Material...',
      analyzingTest: 'Analysiere Test unabhängig...',
      materialsCreated: 'Materialien erstellt',
      learningPlanOverview: 'Lernplan-Übersicht',
      estimatedTime: 'Geschätzte Zeit',
      difficultyLevel: 'Schwierigkeitsgrad',
      focusAreas: 'Schwerpunkte',
      immediately: 'Sofort:',
      thisWeek: 'Diese Woche:',
      thisMonth: 'Diesen Monat:',
      weaknessesDetected: 'Schwächen erkannt',
      curriculumTopicsMatched: 'Lehrplan-Themen zugeordnet',
      tabAnalysis: 'Analyse',
      tabLessons: 'Lektionen',
      tabWorksheets: 'Arbeitsblätter',
      tabQuizzes: 'Quizze',
      overallAssessment: 'Gesamtbewertung',
      detectedWeaknesses: 'Erkannte Schwächen',
      severityLabels: { critical: 'Kritisch', high: 'Hoch', medium: 'Mittel', low: 'Gering' },
      rootCause: 'Ursache:',
      evidenceFromTest: 'Beleg aus dem Test:',
      teacherFeedbackAnalysis: 'Lehrerkommentar-Analyse',
      mainComments: 'Hauptkommentare:',
      correctionPatterns: 'Korrekturmuster:',
      tone: 'Ton:',
      recognizedStrengths: 'Erkannte Stärken',
      prioritizedNeeds: 'Priorisierte Lernbedürfnisse',
      forTarget: 'Für:',
      foundation: 'Grundlagen',
      building: 'Aufbau',
      mastery: 'Meisterung',
      prerequisiteCheck: 'Voraussetzungsprüfung:',
      expectedAnswer: 'Erwartete Antwort:',
      ifFailed: 'Falls nicht bestanden:',
      keyRules: 'Wichtige Regeln:',
      example: 'Beispiel',
      task: 'Aufgabe:',
      step: 'Schritt',
      solution: 'Lösung:',
      commonMistake: 'Häufiger Fehler:',
      practiceProblems: 'Übungsaufgaben:',
      hint: 'Tipp:',
      showAnswer: 'Antwort zeigen',
      hideAnswer: 'Antwort verbergen',
      memoryAids: 'Merkhilfen:',
      memoryAid: 'Merkhilfe:',
      inEverydayLife: 'Im Alltag:',
      parentTip: 'Tipp für Eltern:',
      beginner: 'Anfänger',
      intermediate: 'Mittel',
      advanced: 'Fortgeschritten',
      tasks: 'Aufgaben',
      taskN: 'Aufgabe',
      instructions: 'Anleitung',
      showSolutions: 'Lösungen anzeigen',
      hideSolutions: 'Lösungen verbergen',
      bonusChallenge: 'Bonus-Aufgabe:',
      questions: 'Fragen',
      questionN: 'Frage',
      passing: 'Bestehen:',
      scoring: 'Bewertung:',
      ifWrong: 'Bei Fehler:',
      curriculumTopics: 'Lehrplan-Themen (Curriculum)',
      unlockWithPrime: 'Freischalten mit Prime',
      parentsThisWeek: 'Eltern diese Woche',
      discountToday: '-40% heute',
      unlimitedFlashcards: 'Unbegrenzte personalisierte Lernkarten',
      fairnessCheckFeature: 'Fairness-Check für jede Bewertung',
      aiLearningMaterial: 'KI-generiertes Lernmaterial (Lektionen, Arbeitsblätter, Quizze)',
      detailedProgress: 'Detaillierte Fortschrittsanalysen',
      prioritySupport: 'Prioritäts-Support',
      pdfExport: 'PDF-Export aller Berichte',
      yourChild: 'Ihr Kind',
      teacherLabel: 'Lehrer',
      calculatedLabel: 'Berechnet',
    },
    fa: {
      flashcardsTitle: 'کارت‌های یادگیری شخصی',
      flashcardsDesc: (name: string) => `مخصوص ${name}`,
      flashcardsLockedTitle: 'کارت‌های یادگیری شخصی',
      flashcardsLockedDesc: (count: number, name: string) => `${count}+ کارت یادگیری مخصوص ${name} بر اساس نقاط ضعف آزمون`,
      generateCards: 'ایجاد کارت‌ها',
      generatingCards: 'در حال ایجاد...',
      studyPlan: 'برنامه مطالعه',
      dailyGoal: 'هدف روزانه:',
      totalTime: 'مجموع زمان:',
      reviewSchedule: 'مرور:',
      easy: 'آسان',
      medium: 'متوسط',
      hard: 'سخت',
      clickToFlip: 'کلیک کنید تا برگردد',
      cardLabel: 'کارت',
      questionFront: 'سوال · جلو',
      answerBack: 'جواب · پشت',
      answer: 'جواب',
      print: 'چاپ',
      downloadPDF: 'دانلود PDF',
      errorOccurred: 'خطایی رخ داد',
      cardsCreated: 'کارت ایجاد شد',
      gradeImprovement: 'بهبود نمره',
      fairnessTitle: 'بررسی عدالت',
      fairnessDesc: 'تحلیل مستقل نمره‌دهی',
      fairnessLockedTitle: 'بررسی عدالت در نمره‌دهی',
      fairnessLockedDesc: 'آیا فرزند شما نمره منصفانه گرفت؟ تحلیل هوش مصنوعی با توصیه‌های عملی',
      checkFairness: 'بررسی عدالت',
      analyzingIndependently: 'در حال تحلیل...',
      independentAIAnalysis: 'تحلیل مستقل هوش مصنوعی',
      questionsAnalyzed: 'سوال تحلیل شد',
      concernsFound: 'مشکل یافت شد',
      generatedIn: 'تولید شده در',
      fairnessScore: 'امتیاز عدالت',
      checksPerformed: 'بررسی انجام شد',
      parentsSatisfied: 'والدین راضی',
      verdictFair: 'نمره‌دهی منصفانه است',
      verdictMostlyFair: 'عمدتاً منصفانه',
      verdictSomeConcerns: 'برخی نگرانی‌ها',
      verdictQuestionable: 'قابل بحث',
      verdictNeedsReview: 'نیاز به بررسی',
      verdictNA: 'قابل ارزیابی نیست',
      gradingConsistency: 'ثبات نمره‌دهی',
      pointProportionality: 'تناسب امتیازات',
      partialCredit: 'نمره جزئی',
      clarityOfExpectations: 'وضوح انتظارات',
      feedbackQuality: 'کیفیت بازخورد',
      mathematicalAccuracy: 'دقت ریاضی',
      consistency: 'ثبات',
      clarity: 'وضوح',
      proportionality: 'تناسب',
      tabOverview: 'مرور کلی',
      tabReconstruction: 'بازسازی آزمون',
      tabDetails: 'تحلیل دقیق',
      tabRecovery: 'بازیابی نمره',
      dimensions: 'ابعاد ارزیابی',
      detailAnalysis: 'تحلیل دقیق',
      positiveFindings: 'یافته‌های مثبت',
      concerns: 'نگرانی‌ها',
      severityCritical: 'بحرانی',
      severitySignificant: 'مهم',
      severityModerate: 'متوسط',
      severityMinor: 'جزئی',
      evidence: 'شاهد:',
      pointsAffected: 'امتیازات مؤثر:',
      gradeBoundaryAnalysis: 'تحلیل مرز نمره',
      currentGrade: 'نمره فعلی',
      achieved: 'کسب‌شده',
      recoverable: 'قابل بازیابی',
      gradeChangePossible: 'تغییر نمره ممکن است؟',
      yes: 'بله',
      no: 'خیر',
      testOverview: 'مرور آزمون (بازسازی شده)',
      subjectLabel: 'درس',
      typeLabel: 'نوع',
      pointsLabel: 'امتیاز',
      gradeLabel: 'نمره',
      pointDiscrepancy: 'اختلاف امتیاز یافت شد!',
      taskReconstruction: (count: number) => `بازسازی تکالیف (${count})`,
      correct: 'درست',
      partial: 'جزئی',
      wrong: 'نادرست',
      studentAnswer: 'جواب دانش‌آموز:',
      teacherCorrection: 'تصحیح معلم:',
      deductionReason: 'دلیل کسر:',
      teacherComments: 'نظرات معلم',
      marginNotes: 'یادداشت‌های حاشیه:',
      overallTone: 'لحن کلی:',
      toneEncouraging: 'تشویقی',
      toneCritical: 'انتقادی',
      toneMixed: 'مختلط',
      toneNeutral: 'خنثی',
      potentialRecovery: 'بازیابی بالقوه امتیاز',
      estimatedPotential: 'پتانسیل تخمینی:',
      strongArgument: 'استدلال قوی',
      moderateArgument: 'استدلال متوسط',
      weakArgument: 'استدلال ضعیف',
      current: 'فعلی:',
      possible: 'ممکن:',
      recommendation: 'توصیه',
      contactTeacher: 'صحبت با معلم توصیه می‌شود',
      noContactNeeded: 'نیازی به صحبت نیست',
      urgencyHigh: 'فوری',
      urgencyMedium: 'زودتر',
      urgencyLow: 'در فرصت مناسب',
      conversationOpener: 'شروع مکالمه:',
      talkingPoints: 'نکات گفتگو:',
      avoidThis: 'اجتناب کنید از:',
      recoverablePoints: 'امتیازات قابل بازیابی:',
      disclaimer: 'این تحلیل فقط برای راهنمایی است و بر اساس متن استخراج‌شده توسط OCR می‌باشد. در صورت شک، مستقیماً با معلم صحبت کنید.',
      learningTitle: 'مواد یادگیری شخصی',
      learningDesc: (name: string) => `درس‌ها، کاربرگ‌ها و آزمون‌ها برای ${name}`,
      learningLockedTitle: 'مواد یادگیری شخصی',
      learningLockedDesc: (name: string) => `درس‌ها، کاربرگ‌ها و آزمون‌های تولید شده توسط هوش مصنوعی برای ${name}`,
      generateMaterial: 'ایجاد مواد یادگیری',
      generatingMaterial: 'در حال ایجاد...',
      analyzingTest: 'در حال تحلیل آزمون...',
      materialsCreated: 'مواد ایجاد شد',
      learningPlanOverview: 'مرور برنامه یادگیری',
      estimatedTime: 'زمان تخمینی',
      difficultyLevel: 'سطح دشواری',
      focusAreas: 'حوزه‌های تمرکز',
      immediately: 'فوری:',
      thisWeek: 'این هفته:',
      thisMonth: 'این ماه:',
      weaknessesDetected: 'نقاط ضعف شناسایی شد',
      curriculumTopicsMatched: 'موضوعات برنامه درسی مطابقت دارد',
      tabAnalysis: 'تحلیل',
      tabLessons: 'درس‌ها',
      tabWorksheets: 'کاربرگ‌ها',
      tabQuizzes: 'آزمون‌ها',
      overallAssessment: 'ارزیابی کلی',
      detectedWeaknesses: 'نقاط ضعف شناسایی شده',
      severityLabels: { critical: 'بحرانی', high: 'بالا', medium: 'متوسط', low: 'پایین' },
      rootCause: 'علت اصلی:',
      evidenceFromTest: 'شاهد از آزمون:',
      teacherFeedbackAnalysis: 'تحلیل بازخورد معلم',
      mainComments: 'نظرات اصلی:',
      correctionPatterns: 'الگوهای تصحیح:',
      tone: 'لحن:',
      recognizedStrengths: 'نقاط قوت شناسایی شده',
      prioritizedNeeds: 'نیازهای یادگیری اولویت‌بندی شده',
      forTarget: 'برای:',
      foundation: 'پایه',
      building: 'ساخت',
      mastery: 'تسلط',
      prerequisiteCheck: 'بررسی پیش‌نیاز:',
      expectedAnswer: 'پاسخ مورد انتظار:',
      ifFailed: 'در صورت عدم موفقیت:',
      keyRules: 'قوانین کلیدی:',
      example: 'مثال',
      task: 'تکلیف:',
      step: 'مرحله',
      solution: 'راه‌حل:',
      commonMistake: 'اشتباه رایج:',
      practiceProblems: 'تمرین‌ها:',
      hint: 'راهنما:',
      showAnswer: 'نمایش جواب',
      hideAnswer: 'پنهان کردن جواب',
      memoryAids: 'کمک‌های حفظ:',
      memoryAid: 'کمک حفظ:',
      inEverydayLife: 'در زندگی روزمره:',
      parentTip: 'نکته برای والدین:',
      beginner: 'مبتدی',
      intermediate: 'متوسط',
      advanced: 'پیشرفته',
      tasks: 'تکالیف',
      taskN: 'تکلیف',
      instructions: 'دستورالعمل',
      showSolutions: 'نمایش راه‌حل‌ها',
      hideSolutions: 'پنهان کردن راه‌حل‌ها',
      bonusChallenge: 'چالش اضافی:',
      questions: 'سوالات',
      questionN: 'سوال',
      passing: 'قبولی:',
      scoring: 'نمره‌دهی:',
      ifWrong: 'در صورت اشتباه:',
      curriculumTopics: 'موضوعات برنامه درسی',
      unlockWithPrime: 'با Prime باز کنید',
      parentsThisWeek: 'والدین این هفته',
      discountToday: '-۴۰٪ امروز',
      upgradeToPrime: 'ارتقا به Prime',
      unlimitedFlashcards: 'کارت‌های یادگیری نامحدود',
      fairnessCheckFeature: 'بررسی عدالت برای هر آزمون',
      aiLearningMaterial: 'مواد یادگیری تولید شده توسط هوش مصنوعی',
      detailedProgress: 'تحلیل‌های دقیق پیشرفت',
      prioritySupport: 'پشتیبانی اولویت‌دار',
      pdfExport: 'خروجی PDF همه گزارش‌ها',
      yourChild: 'فرزند شما',
      teacherLabel: 'معلم',
      calculatedLabel: 'محاسبه شده',
    },
    ar: {
      flashcardsTitle: 'بطاقات التعلم الشخصية',
      flashcardsDesc: (name: string) => `مخصص لـ ${name}`,
      flashcardsLockedTitle: 'بطاقات التعلم الشخصية',
      flashcardsLockedDesc: (count: number, name: string) => `${count}+ بطاقة تعلم مخصصة لـ ${name} بناءً على نقاط الضعف`,
      generateCards: 'إنشاء البطاقات',
      generatingCards: 'جاري الإنشاء...',
      studyPlan: 'خطة الدراسة',
      dailyGoal: 'الهدف اليومي:',
      totalTime: 'إجمالي الوقت:',
      reviewSchedule: 'المراجعة:',
      easy: 'سهل',
      medium: 'متوسط',
      hard: 'صعب',
      clickToFlip: 'انقر للقلب',
      cardLabel: 'بطاقة',
      questionFront: 'سؤال · الأمام',
      answerBack: 'جواب · الخلف',
      answer: 'جواب',
      print: 'طباعة',
      downloadPDF: 'تحميل PDF',
      errorOccurred: 'حدث خطأ',
      cardsCreated: 'بطاقة تم إنشاؤها',
      gradeImprovement: 'تحسين الدرجة',
      fairnessTitle: 'فحص العدالة',
      fairnessDesc: 'تحليل مستقل للتقييم',
      fairnessLockedTitle: 'فحص عدالة التقييم',
      fairnessLockedDesc: 'هل تلقى طفلك تقييمًا عادلًا؟ تحليل الذكاء الاصطناعي مع توصيات عملية',
      checkFairness: 'فحص العدالة',
      analyzingIndependently: 'جاري التحليل...',
      independentAIAnalysis: 'تحليل الذكاء الاصطناعي المستقل',
      questionsAnalyzed: 'سؤال تم تحليله',
      concernsFound: 'مخاوف وجدت',
      generatedIn: 'تم الإنشاء في',
      fairnessScore: 'درجة العدالة',
      checksPerformed: 'فحوصات أُجريت',
      parentsSatisfied: 'آباء راضون',
      verdictFair: 'التقييم عادل',
      verdictMostlyFair: 'عادل في معظمه',
      verdictSomeConcerns: 'بعض المخاوف',
      verdictQuestionable: 'مشكوك فيه',
      verdictNeedsReview: 'يُنصح بالمراجعة',
      verdictNA: 'غير قابل للتقييم',
      gradingConsistency: 'اتساق التقييم',
      pointProportionality: 'تناسب النقاط',
      partialCredit: 'الائتمان الجزئي',
      clarityOfExpectations: 'وضوح التوقعات',
      feedbackQuality: 'جودة التغذية الراجعة',
      mathematicalAccuracy: 'الدقة الحسابية',
      consistency: 'الاتساق',
      clarity: 'الوضوح',
      proportionality: 'التناسب',
      tabOverview: 'نظرة عامة',
      tabReconstruction: 'إعادة بناء الاختبار',
      tabDetails: 'تحليل مفصل',
      tabRecovery: 'استرداد النقاط',
      dimensions: 'أبعاد التقييم',
      detailAnalysis: 'تحليل مفصل',
      positiveFindings: 'النتائج الإيجابية',
      concerns: 'المخاوف',
      severityCritical: 'حرج',
      severitySignificant: 'مهم',
      severityModerate: 'معتدل',
      severityMinor: 'بسيط',
      evidence: 'الدليل:',
      pointsAffected: 'النقاط المتأثرة:',
      gradeBoundaryAnalysis: 'تحليل حدود الدرجة',
      currentGrade: 'الدرجة الحالية',
      achieved: 'المحقق',
      recoverable: 'قابل للاسترداد',
      gradeChangePossible: 'هل تغيير الدرجة ممكن؟',
      yes: 'نعم',
      no: 'لا',
      testOverview: 'نظرة عامة على الاختبار (مُعاد بناؤه)',
      subjectLabel: 'المادة',
      typeLabel: 'النوع',
      pointsLabel: 'النقاط',
      gradeLabel: 'الدرجة',
      pointDiscrepancy: 'اختلاف في النقاط!',
      taskReconstruction: (count: number) => `إعادة بناء المهام (${count})`,
      correct: 'صحيح',
      partial: 'جزئي',
      wrong: 'خاطئ',
      studentAnswer: 'إجابة الطالب:',
      teacherCorrection: 'تصحيح المعلم:',
      deductionReason: 'سبب الخصم:',
      teacherComments: 'تعليقات المعلم',
      marginNotes: 'ملاحظات الهامش:',
      overallTone: 'النبرة العامة:',
      toneEncouraging: 'تشجيعي',
      toneCritical: 'نقدي',
      toneMixed: 'مختلط',
      toneNeutral: 'محايد',
      potentialRecovery: 'استرداد النقاط المحتمل',
      estimatedPotential: 'الإمكانية المقدرة:',
      strongArgument: 'حجة قوية',
      moderateArgument: 'حجة معتدلة',
      weakArgument: 'حجة ضعيفة',
      current: 'الحالي:',
      possible: 'الممكن:',
      recommendation: 'التوصية',
      contactTeacher: 'يُنصح بمناقشة المعلم',
      noContactNeeded: 'لا حاجة لمناقشة',
      urgencyHigh: 'عاجل',
      urgencyMedium: 'قريبًا',
      urgencyLow: 'عند الفرصة',
      conversationOpener: 'مقدمة المحادثة:',
      talkingPoints: 'نقاط الحوار:',
      avoidThis: 'تجنب:',
      recoverablePoints: 'النقاط القابلة للاسترداد:',
      disclaimer: 'هذا التحليل للتوجيه فقط ومبني على نص مستخرج بـ OCR. عند الشك، تحدث مع المعلم مباشرة.',
      learningTitle: 'مواد التعلم الشخصية',
      learningDesc: (name: string) => `دروس وأوراق عمل واختبارات لـ ${name}`,
      learningLockedTitle: 'مواد التعلم الشخصية',
      learningLockedDesc: (name: string) => `دروس وأوراق عمل واختبارات مُنشأة بالذكاء الاصطناعي لـ ${name}`,
      generateMaterial: 'إنشاء مواد التعلم',
      generatingMaterial: 'جاري الإنشاء...',
      analyzingTest: 'جاري تحليل الاختبار...',
      materialsCreated: 'مواد تم إنشاؤها',
      learningPlanOverview: 'نظرة عامة على خطة التعلم',
      estimatedTime: 'الوقت المقدر',
      difficultyLevel: 'مستوى الصعوبة',
      focusAreas: 'مجالات التركيز',
      immediately: 'فورًا:',
      thisWeek: 'هذا الأسبوع:',
      thisMonth: 'هذا الشهر:',
      weaknessesDetected: 'نقاط ضعف مكتشفة',
      curriculumTopicsMatched: 'موضوعات المنهج متطابقة',
      tabAnalysis: 'تحليل',
      tabLessons: 'دروس',
      tabWorksheets: 'أوراق عمل',
      tabQuizzes: 'اختبارات',
      overallAssessment: 'التقييم العام',
      detectedWeaknesses: 'نقاط الضعف المكتشفة',
      severityLabels: { critical: 'حرج', high: 'عالٍ', medium: 'معتدل', low: 'منخفض' },
      rootCause: 'السبب الجذري:',
      evidenceFromTest: 'الدليل من الاختبار:',
      teacherFeedbackAnalysis: 'تحليل تغذية المعلم الراجعة',
      mainComments: 'التعليقات الرئيسية:',
      correctionPatterns: 'أنماط التصحيح:',
      tone: 'النبرة:',
      recognizedStrengths: 'نقاط القوة المعترف بها',
      prioritizedNeeds: 'احتياجات التعلم ذات الأولوية',
      forTarget: 'لـ:',
      foundation: 'الأساس',
      building: 'البناء',
      mastery: 'الإتقان',
      prerequisiteCheck: 'فحص المتطلبات:',
      expectedAnswer: 'الإجابة المتوقعة:',
      ifFailed: 'عند الفشل:',
      keyRules: 'القواعد الأساسية:',
      example: 'مثال',
      task: 'المهمة:',
      step: 'خطوة',
      solution: 'الحل:',
      commonMistake: 'الخطأ الشائع:',
      practiceProblems: 'تمارين:',
      hint: 'تلميح:',
      showAnswer: 'إظهار الجواب',
      hideAnswer: 'إخفاء الجواب',
      memoryAids: 'وسائل مساعدة للحفظ:',
      memoryAid: 'وسيلة حفظ:',
      inEverydayLife: 'في الحياة اليومية:',
      parentTip: 'نصيحة للوالدين:',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم',
      tasks: 'مهام',
      taskN: 'مهمة',
      instructions: 'تعليمات',
      showSolutions: 'إظهار الحلول',
      hideSolutions: 'إخفاء الحلول',
      bonusChallenge: 'تحدي إضافي:',
      questions: 'أسئلة',
      questionN: 'سؤال',
      passing: 'النجاح:',
      scoring: 'التقييم:',
      ifWrong: 'عند الخطأ:',
      curriculumTopics: 'موضوعات المنهج',
      unlockWithPrime: 'افتح مع Prime',
      parentsThisWeek: 'آباء هذا الأسبوع',
      discountToday: '-40% اليوم',
      upgradeToPrime: 'الترقية إلى Prime',
      unlimitedFlashcards: 'بطاقات تعلم غير محدودة',
      fairnessCheckFeature: 'فحص العدالة لكل اختبار',
      aiLearningMaterial: 'مواد تعلم بالذكاء الاصطناعي',
      detailedProgress: 'تحليلات تقدم مفصلة',
      prioritySupport: 'دعم ذو أولوية',
      pdfExport: 'تصدير PDF لجميع التقارير',
      yourChild: 'طفلك',
      teacherLabel: 'المعلم',
      calculatedLabel: 'محسوب',
    },
    tr: {
      flashcardsTitle: 'Kişiselleştirilmiş Öğrenme Kartları',
      flashcardsDesc: (name: string) => `${name} için özelleştirilmiş`,
      flashcardsLockedTitle: 'Kişiselleştirilmiş Öğrenme Kartları',
      flashcardsLockedDesc: (count: number, name: string) => `${name} için ${count}+ öğrenme kartı`,
      generateCards: 'Kartları Oluştur',
      generatingCards: 'Kartlar oluşturuluyor...',
      studyPlan: 'Çalışma Planı',
      dailyGoal: 'Günlük Hedef:',
      totalTime: 'Toplam Süre:',
      reviewSchedule: 'Tekrar:',
      easy: 'Kolay',
      medium: 'Orta',
      hard: 'Zor',
      clickToFlip: 'Çevirmek için tıklayın',
      cardLabel: 'Kart',
      questionFront: 'Soru · Ön Yüz',
      answerBack: 'Cevap · Arka Yüz',
      answer: 'Cevap',
      print: 'Yazdır',
      downloadPDF: 'PDF İndir',
      errorOccurred: 'Hata oluştu',
      cardsCreated: 'Kart oluşturuldu',
      gradeImprovement: 'Not iyileştirme',
      fairnessTitle: 'Adalet Kontrolü',
      fairnessDesc: 'Bağımsız not analizi',
      fairnessLockedTitle: 'Not Adaleti Kontrolü',
      fairnessLockedDesc: 'Çocuğunuz adil not aldı mı? Yapay zeka analizi ile somut öneriler',
      checkFairness: 'Adaleti Kontrol Et',
      analyzingIndependently: 'Analiz ediliyor...',
      independentAIAnalysis: 'Bağımsız Yapay Zeka Analizi',
      questionsAnalyzed: 'soru analiz edildi',
      concernsFound: 'endişe bulundu',
      generatedIn: 'Oluşturulma süresi',
      fairnessScore: 'Adalet Puanı',
      checksPerformed: 'kontrol yapıldı',
      parentsSatisfied: 'veli memnun',
      verdictFair: 'Değerlendirme adil',
      verdictMostlyFair: 'Çoğunlukla adil',
      verdictSomeConcerns: 'Bazı endişeler',
      verdictQuestionable: 'Sorgulanabilir',
      verdictNeedsReview: 'İnceleme önerilir',
      verdictNA: 'Değerlendirilemez',
      gradingConsistency: 'Değerlendirme tutarlılığı',
      pointProportionality: 'Puan orantısallığı',
      partialCredit: 'Kısmi Kredi',
      clarityOfExpectations: 'Beklentilerin netliği',
      feedbackQuality: 'Geri bildirim kalitesi',
      mathematicalAccuracy: 'Matematiksel doğruluk',
      consistency: 'Tutarlılık',
      clarity: 'Netlik',
      proportionality: 'Orantısallık',
      tabOverview: 'Genel Bakış',
      tabReconstruction: 'Test Yeniden Yapılandırma',
      tabDetails: 'Detaylı Analiz',
      tabRecovery: 'Puan Kurtarma',
      dimensions: 'Değerlendirme Boyutları',
      detailAnalysis: 'Detaylı Analiz',
      positiveFindings: 'Olumlu Bulgular',
      concerns: 'Endişeler',
      severityCritical: 'Kritik',
      severitySignificant: 'Önemli',
      severityModerate: 'Orta',
      severityMinor: 'Az',
      evidence: 'Kanıt:',
      pointsAffected: 'Etkilenen puanlar:',
      gradeBoundaryAnalysis: 'Not Sınırı Analizi',
      currentGrade: 'Mevcut Not',
      achieved: 'Ulaşılan',
      recoverable: 'Kurtarılabilir',
      gradeChangePossible: 'Not değişikliği mümkün mü?',
      yes: 'Evet',
      no: 'Hayır',
      testOverview: 'Test Genel Bakışı (yeniden yapılandırılmış)',
      subjectLabel: 'Ders',
      typeLabel: 'Tür',
      pointsLabel: 'Puan',
      gradeLabel: 'Not',
      pointDiscrepancy: 'Puan farklılığı bulundu!',
      taskReconstruction: (count: number) => `Görev Yeniden Yapılandırma (${count})`,
      correct: 'Doğru',
      partial: 'Kısmi',
      wrong: 'Yanlış',
      studentAnswer: 'Öğrenci cevabı:',
      teacherCorrection: 'Öğretmen düzeltmesi:',
      deductionReason: 'Kesinti nedeni:',
      teacherComments: 'Öğretmen Yorumları',
      marginNotes: 'Kenar notları:',
      overallTone: 'Genel ton:',
      toneEncouraging: 'Teşvik edici',
      toneCritical: 'Eleştirel',
      toneMixed: 'Karma',
      toneNeutral: 'Nötr',
      potentialRecovery: 'Potansiyel Puan Kurtarma',
      estimatedPotential: 'Tahmini potansiyel:',
      strongArgument: 'Güçlü argüman',
      moderateArgument: 'Orta argüman',
      weakArgument: 'Zayıf argüman',
      current: 'Mevcut:',
      possible: 'Olası:',
      recommendation: 'Öneri',
      contactTeacher: 'Öğretmenle görüşme önerilir',
      noContactNeeded: 'Görüşme gerekmiyor',
      urgencyHigh: 'Acil',
      urgencyMedium: 'Yakında',
      urgencyLow: 'Uygun zamanda',
      conversationOpener: 'Konuşma başlangıcı:',
      talkingPoints: 'Konuşma noktaları:',
      avoidThis: 'Kaçının:',
      recoverablePoints: 'Kurtarılabilir puanlar:',
      disclaimer: 'Bu analiz yalnızca rehberlik içindir. Şüphe durumunda öğretmenle doğrudan konuşun.',
      learningTitle: 'Kişiselleştirilmiş Öğrenme Materyali',
      learningDesc: (name: string) => `${name} için dersler, çalışma kağıtları ve quizler`,
      learningLockedTitle: 'Kişiselleştirilmiş Öğrenme Materyali',
      learningLockedDesc: (name: string) => `${name} için yapay zeka tarafından oluşturulmuş dersler, çalışma kağıtları ve quizler`,
      generateMaterial: 'Öğrenme Materyali Oluştur',
      generatingMaterial: 'Materyal oluşturuluyor...',
      analyzingTest: 'Test analiz ediliyor...',
      materialsCreated: 'Materyal oluşturuldu',
      learningPlanOverview: 'Öğrenme Planı Genel Bakışı',
      estimatedTime: 'Tahmini Süre',
      difficultyLevel: 'Zorluk Seviyesi',
      focusAreas: 'Odak Alanları',
      immediately: 'Hemen:',
      thisWeek: 'Bu hafta:',
      thisMonth: 'Bu ay:',
      weaknessesDetected: 'zayıflık tespit edildi',
      curriculumTopicsMatched: 'müfredat konusu eşleşti',
      tabAnalysis: 'Analiz',
      tabLessons: 'Dersler',
      tabWorksheets: 'Çalışma Kağıtları',
      tabQuizzes: 'Quizler',
      overallAssessment: 'Genel Değerlendirme',
      detectedWeaknesses: 'Tespit Edilen Zayıflıklar',
      severityLabels: { critical: 'Kritik', high: 'Yüksek', medium: 'Orta', low: 'Düşük' },
      rootCause: 'Kök neden:',
      evidenceFromTest: 'Testten kanıt:',
      teacherFeedbackAnalysis: 'Öğretmen Geri Bildirimi Analizi',
      mainComments: 'Ana yorumlar:',
      correctionPatterns: 'Düzeltme kalıpları:',
      tone: 'Ton:',
      recognizedStrengths: 'Tanınan Güçlü Yönler',
      prioritizedNeeds: 'Öncelikli Öğrenme İhtiyaçları',
      forTarget: 'İçin:',
      foundation: 'Temel',
      building: 'Yapı',
      mastery: 'Ustalık',
      prerequisiteCheck: 'Ön koşul kontrolü:',
      expectedAnswer: 'Beklenen cevap:',
      ifFailed: 'Başarısız olursa:',
      keyRules: 'Temel kurallar:',
      example: 'Örnek',
      task: 'Görev:',
      step: 'Adım',
      solution: 'Çözüm:',
      commonMistake: 'Yaygın hata:',
      practiceProblems: 'Alıştırmalar:',
      hint: 'İpucu:',
      showAnswer: 'Cevabı Göster',
      hideAnswer: 'Cevabı Gizle',
      memoryAids: 'Hafıza Yardımcıları:',
      memoryAid: 'Hafıza Yardımcısı:',
      inEverydayLife: 'Günlük hayatta:',
      parentTip: 'Ebeveynler için ipucu:',
      beginner: 'Başlangıç',
      intermediate: 'Orta',
      advanced: 'İleri',
      tasks: 'Görevler',
      taskN: 'Görev',
      instructions: 'Talimatlar',
      showSolutions: 'Çözümleri göster',
      hideSolutions: 'Çözümleri gizle',
      bonusChallenge: 'Bonus Görev:',
      questions: 'Sorular',
      questionN: 'Soru',
      passing: 'Geçme:',
      scoring: 'Puanlama:',
      ifWrong: 'Yanlışsa:',
      curriculumTopics: 'Müfredat Konuları',
      unlockWithPrime: "Prime ile Aç",
      parentsThisWeek: 'veli bu hafta',
      discountToday: 'Bugün -40%',
      upgradeToPrime: "Prime'e Yükselt",
      unlimitedFlashcards: 'Sınırsız kişiselleştirilmiş öğrenme kartları',
      fairnessCheckFeature: 'Her test için adalet kontrolü',
      aiLearningMaterial: 'Yapay zeka destekli öğrenme materyali',
      detailedProgress: 'Detaylı ilerleme analizleri',
      prioritySupport: 'Öncelikli destek',
      pdfExport: 'Tüm raporların PDF dışa aktarımı',
      yourChild: 'çocuğunuz',
      teacherLabel: 'Öğretmen',
      calculatedLabel: 'Hesaplanan',
    },
    ro: {
      flashcardsTitle: 'Carduri de Învățare Personalizate',
      studyPlan: 'Plan de Studiu',
      dailyGoal: 'Obiectiv zilnic:',
      easy: 'Ușor',
      medium: 'Mediu',
      hard: 'Greu',
      clickToFlip: 'Clic pentru a întoarce',
      cardLabel: 'Card',
      questionFront: 'Întrebare · Față',
      answerBack: 'Răspuns · Spate',
      print: 'Tipărire',
      downloadPDF: 'Descarcă PDF',
      fairnessTitle: 'Verificare Corectitudine',
      fairnessScore: 'Scor Corectitudine',
      positiveFindings: 'Constatări Pozitive',
      concerns: 'Îngrijorări',
      severityModerate: 'Moderat',
      severityCritical: 'Critic',
      severitySignificant: 'Semnificativ',
      severityMinor: 'Minor',
      gradeBoundaryAnalysis: 'Analiza Limitei de Notă',
      currentGrade: 'Nota Curentă',
      achieved: 'Atins',
      recoverable: 'Recuperabil',
      gradeChangePossible: 'Schimbarea notei este posibilă?',
      tabOverview: 'Prezentare Generală',
      tabReconstruction: 'Reconstrucție Test',
      tabDetails: 'Analiză Detaliată',
      tabRecovery: 'Recuperare Puncte',
      contactTeacher: 'Discuție cu profesorul recomandată',
      noContactNeeded: 'Nu e necesară discuție',
      urgencyHigh: 'Urgent',
      urgencyMedium: 'Curând',
      urgencyLow: 'Când e convenabil',
      conversationOpener: 'Deschidere conversație:',
      talkingPoints: 'Puncte de discuție:',
      recommendation: 'Recomandare',
      yes: 'Da',
      no: 'Nu',
      correct: 'Corect',
      partial: 'Parțial',
      wrong: 'Greșit',
      yourChild: 'copilul dvs.',
      teacherLabel: 'Profesor',
      calculatedLabel: 'Calculat',
    },
    ru: {
      flashcardsTitle: 'Персонализированные Учебные Карточки',
      studyPlan: 'План Обучения',
      dailyGoal: 'Дневная цель:',
      easy: 'Легко',
      medium: 'Средне',
      hard: 'Сложно',
      clickToFlip: 'Нажмите для переворота',
      cardLabel: 'Карточка',
      questionFront: 'Вопрос · Лицевая сторона',
      answerBack: 'Ответ · Обратная сторона',
      print: 'Печать',
      downloadPDF: 'Скачать PDF',
      fairnessTitle: 'Проверка Справедливости',
      fairnessScore: 'Оценка Справедливости',
      positiveFindings: 'Положительные Выводы',
      concerns: 'Замечания',
      severityModerate: 'Умеренный',
      severityCritical: 'Критический',
      severitySignificant: 'Значительный',
      severityMinor: 'Незначительный',
      gradeBoundaryAnalysis: 'Анализ Границы Оценки',
      currentGrade: 'Текущая Оценка',
      achieved: 'Достигнуто',
      recoverable: 'Можно вернуть',
      gradeChangePossible: 'Изменение оценки возможно?',
      tabOverview: 'Обзор',
      tabReconstruction: 'Реконструкция Теста',
      tabDetails: 'Детальный Анализ',
      tabRecovery: 'Восстановление Баллов',
      contactTeacher: 'Рекомендуется поговорить с учителем',
      noContactNeeded: 'Разговор не нужен',
      urgencyHigh: 'Срочно',
      urgencyMedium: 'Скоро',
      urgencyLow: 'При возможности',
      conversationOpener: 'Начало разговора:',
      talkingPoints: 'Темы для разговора:',
      recommendation: 'Рекомендация',
      yes: 'Да',
      no: 'Нет',
      correct: 'Правильно',
      partial: 'Частично',
      wrong: 'Неверно',
      yourChild: 'ваш ребёнок',
      teacherLabel: 'Учитель',
      calculatedLabel: 'Вычислено',
    },
  }

  return { ...en, ...(overrides[lang] || {}) }
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
  const { language: uiLang } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)
  const [flashcards, setFlashcards] = useState<any>(cachedData || null)
  const [error, setError] = useState<string | null>(null)
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const { t, language: globalLang } = useLanguage()
  const pt = getPremiumTranslation(globalLang)

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
      setError(err instanceof Error ? err.message : ('An error occurred to generate flashcards'))
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
        title={pt.personalizedFlashcards}
        description={
          ('de' === 'de'
            ? `${analysisData?.weaknesses?.length || 3}+ Lernkarten speziell für ${childName || 'Ihr Kind'} basierend auf den Testschwächen`
            : `${analysisData?.weaknesses?.length || 3}+ flashcards tailored for ${childName || 'your child'} based on test weaknesses`)
        }
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
          { label: pt.cardsCreated, value: FOMO_STATS.flashcardsGenerated.toLocaleString() },
          { label: pt.gradeImprovement, value: `+${FOMO_STATS.avgGradeImprovement}` },
        ]}
        onUpgrade={onUpgrade}
      />
    )
  }

  // Premium user - full feature
  return (
    <div data-print="flashcards" className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-amber-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {pt.personalizedFlashcards}
              <PremiumBadge size="sm" />
            </h3>
            <p className="text-sm text-gray-600">
              pt.tailoredFor(childName || '')
            </p>
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
                {pt.creatingCards}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {pt.generateFlashcards}
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
                {pt.studyPlan}
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{pt.dailyGoal}</span>
                  <p className="font-medium">{flashcards.studyPlan.dailyGoal}</p>
                </div>
                <div>
                  <span className="text-gray-500">{pt.totalTime}</span>
                  <p className="font-medium">{flashcards.studyPlan.totalTime}</p>
                </div>
                <div>
                  <span className="text-gray-500">{pt.review}</span>
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
                {/* Front */}
                {!flippedCards.has(i) && (
                  <div className="bg-white rounded-xl p-5 border-2 border-amber-200 shadow-md transition-all hover:shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${card.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        card.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                        {card.difficulty === 'easy' ? (pt.easy) : card.difficulty === 'hard' ? (pt.hard) : (pt.medium)}
                      </span>
                      <span className="text-xs text-gray-400">{pt.clickToFlip}</span>
                    </div>
                    <p className="text-lg font-medium text-gray-800">{card.front}</p>
                    {card.forWeakness && (
                      <p className="mt-3 text-xs text-gray-500 border-t pt-2">
                        {pt.forLabel} {card.forWeakness}
                      </p>
                    )}
                  </div>
                )}

                {/* Back */}
                {flippedCards.has(i) && (
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-md transition-all hover:shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{pt.answer}</span>
                      <span className="text-xs opacity-70">{'Click to flip'}</span>
                    </div>
                    <p className="text-lg font-medium">{card.back}</p>
                    {card.tip && (
                      <p className="mt-3 text-sm bg-white/10 rounded-lg p-2">
                        {card.tip}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => printSectionOnly('flashcards')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              {pt.print}
            </button>
            <button
              onClick={() => {
                if (NON_LATIN_LANGS.includes(uiLang)) {
                  printSectionOnly('flashcards')
                } else {
                  generateFlashcardsPDF(flashcards, {
                    childName,
                    subject: analysisData?.test?.subject,
                  })
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              {pt.downloadPDF}
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
  const { language: uiLang } = useLanguage()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [fairnessData, setFairnessData] = useState<any>(cachedData || null)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'overview' | 'reconstruction' | 'details' | 'recovery'>('overview')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const { t, language: globalLang } = useLanguage()
  const pt = getPremiumTranslation(globalLang)

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
      setError(err instanceof Error ? err.message : ('An error occurred'))
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
      case 'fair': return 'Fair'
      case 'mostly_fair': return 'Mostly Fair'
      case 'some_concerns': return 'Some Concerns'
      case 'questionable': return 'Questionable'
      case 'needs_review': return 'Needs Review'
      default: return 'N/A'
    }
  }

  const getDimensionLabel = (key: string) => {
    const labels: Record<string, string> = {
      gradingConsistency: 'Grading Consistency',
      pointProportionality: 'Point Proportionality',
      partialCredit: 'Partial Credit',
      clarityOfExpectations: 'Clarity of Expectations',
      feedbackQuality: 'Feedback Quality',
      mathematicalAccuracy: 'Mathematical Accuracy',
      consistency: 'Consistency',
      clarity: 'Clarity',
      proportionality: 'Proportionality',
    }
    return labels[key] || key
  }

  if (!isPremium) {
    return (
      <LockedFeatureTeaser
        title={pt.fairnessCheck}
        description={pt.fairnessLockedDesc}
        icon={Shield}
        previewContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
              <span className="text-gray-700">{pt.fairnessScore}</span>
              <span className="text-2xl font-bold text-gray-400">??%</span>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <span className="text-gray-500">
                {'de' === 'de' ? (
                  <>Wir haben <strong className="text-amber-600">3 mögliche Bedenken</strong> gefunden...</>
                ) : (
                  <>We found <strong className="text-amber-600">3 potential concerns</strong>...</>
                )}
              </span>
            </div>
          </div>
        }
        stats={[
          { label: pt.checksPerformed, value: FOMO_STATS.fairnessChecksRun.toLocaleString() },
          { label: pt.parentsSatisfied, value: `${FOMO_STATS.parentsSatisfied}%` },
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
    <div data-print="fairness" className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {'Fairness Check'}
              <PremiumBadge size="sm" />
            </h3>
            <p className="text-sm text-gray-600">{pt.fairnessCheckDesc}</p>
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
                {pt.analyzingIndependently}
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                {pt.checkFairness}
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
                  <p className="font-medium text-blue-800">{pt.independentAIAnalysis}</p>
                  <p className="text-sm text-blue-600">
                    {fairnessData.metadata.questionsAnalyzed} {pt.questionsAnalyzed}
                    {' '}&bull;{' '}
                    {fairnessData.metadata.concernsFound} {pt.concernsFound}
                    {' '}&bull;{' '}
                    {pt.generatedIn} {fairnessData.metadata.totalGenerationTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main score and verdict */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-blue-200 text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">{analysis?.overallScore || analysis?.fairnessScore || '—'}%</div>
              <div className="text-gray-600">{'Fairness Score'}</div>
            </div>
            <div className={`rounded-xl p-6 border ${getVerdictColor(analysis?.verdict || '')} text-center`}>
              <div className="text-2xl font-bold mb-2">{getVerdictText(analysis?.verdict || '')}</div>
              <div className="text-sm opacity-80">{analysis?.verdictSummary || analysis?.verdictExplanation || ''}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-blue-200 pb-2 overflow-x-auto">
            {[
              { id: 'overview' as const, label: pt.overview },
              ...(testRecon ? [{ id: 'reconstruction' as const, label: pt.reconstruction }] : []),
              { id: 'details' as const, label: pt.details },
              ...(analysis?.pointRecoveryOpportunities?.length ? [{ id: 'recovery' as const, label: pt.actionPlan }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors text-sm ${activeView === tab.id
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
                  <h4 className="font-bold text-gray-800 mb-4">{pt.dimensions}</h4>
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
                  <h4 className="font-bold text-gray-800 mb-4">{pt.detailedAnalysis}</h4>
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
                    {pt.positiveFindings}
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
                    {pt.concerns} ({analysis.concerns.length})
                  </h4>
                  <div className="space-y-3">
                    {analysis.concerns.map((concern: any, i: number) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-amber-200">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-gray-800">{concern.title || concern.issue}</span>
                          <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${concern.severity === 'critical' || concern.severity === 'significant' ? 'bg-red-100 text-red-700' :
                            concern.severity === 'moderate' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {concern.severity === 'critical' ? (pt.critical) :
                              concern.severity === 'significant' ? (pt.significant) :
                                concern.severity === 'moderate' ? (pt.moderate) : (pt.minor)}
                          </span>
                        </div>
                        {concern.detail && <p className="text-sm text-gray-600">{concern.detail}</p>}
                        {concern.evidence && (
                          <p className="text-xs text-gray-500 mt-1 italic">{pt.evidence} "{concern.evidence}"</p>
                        )}
                        {concern.pointsAffected && (
                          <p className="text-xs text-amber-600 mt-1 font-medium">{pt.pointsAffected} {concern.pointsAffected}</p>
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
                    {pt.gradeBoundaryAnalysis}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.gradeBoundaryAnalysis.currentGrade}</div>
                      <div className="text-xs text-gray-500">{pt.currentGrade}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.gradeBoundaryAnalysis.percentage}%</div>
                      <div className="text-xs text-gray-500">{pt.achieved}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.gradeBoundaryAnalysis.potentialRecoverablePoints}</div>
                      <div className="text-xs text-gray-500">{pt.recoverable}</div>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${analysis.gradeBoundaryAnalysis.couldChangeGrade ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <div className={`text-2xl font-bold ${analysis.gradeBoundaryAnalysis.couldChangeGrade ? 'text-green-600' : 'text-gray-500'}`}>
                        {analysis.gradeBoundaryAnalysis.couldChangeGrade ? (pt.yes) : (pt.no)}
                      </div>
                      <div className="text-xs text-gray-500">{pt.gradeChangePossible}</div>
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
                <h4 className="font-bold text-gray-800 mb-3">{pt.testOverview}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{pt.subject}</div>
                    <div className="font-medium">{testRecon.subject || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{pt.type}</div>
                    <div className="font-medium">{testRecon.testType || '—'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{pt.points}</div>
                    <div className="font-medium">{testRecon.achievedPoints || '?'} / {testRecon.maxPoints || '?'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{pt.grade}</div>
                    <div className="font-medium">{testRecon.gradeGiven || '—'}</div>
                  </div>
                </div>

                {/* Point calculation check */}
                {testRecon.pointCalculationCheck?.discrepancy && (
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200 mb-4">
                    <p className="text-sm text-red-700 font-medium">⚠️ {pt.pointCalculationDiscrepancy}</p>
                    <p className="text-sm text-red-600">
                      {language === 'de' ? 'Lehrer' : 'Teacher'}: {testRecon.pointCalculationCheck.teacherTotal} {'Points'} &bull;
                      {language === 'de' ? 'Berechnet' : 'Calculated'}: {testRecon.pointCalculationCheck.myCalculatedTotal} {'Points'}
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
                    <h4 className="font-bold text-gray-800">{pt.taskReconstruction} ({testRecon.questions.length})</h4>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {testRecon.questions.map((q: any, i: number) => (
                      <div key={i} className="p-4">
                        <button
                          onClick={() => toggleExpand(`q-${i}`)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${q.isCorrect ? 'bg-green-100 text-green-700' :
                              q.isPartiallyCorrect ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {q.number}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800 text-sm line-clamp-1">{q.questionText}</span>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{q.pointsGiven}/{q.maxPoints} {'Points'}</span>
                                {q.isCorrect && <span className="text-green-600">✓ {pt.correct}</span>}
                                {q.isPartiallyCorrect && <span className="text-amber-600">~ {pt.partial}</span>}
                                {!q.isCorrect && !q.isPartiallyCorrect && <span className="text-red-600">✗ {pt.wrong}</span>}
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
                                <span className="text-xs font-medium text-gray-500">{pt.studentAnswer} </span>
                                <span className="text-gray-700">{q.studentAnswer}</span>
                              </div>
                            )}
                            {q.teacherMarks && (
                              <div className="bg-blue-50 rounded p-2">
                                <span className="text-xs font-medium text-blue-600">{pt.teacherCorrection} </span>
                                <span className="text-gray-700">{q.teacherMarks}</span>
                              </div>
                            )}
                            {q.deductionReason && (
                              <div className="bg-amber-50 rounded p-2">
                                <span className="text-xs font-medium text-amber-600">{pt.reasonForDeduction} </span>
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
                  <h4 className="font-bold text-blue-800 mb-3">{pt.teacherComments}</h4>
                  {testRecon.teacherComments.finalComment && (
                    <blockquote className="border-l-4 border-blue-400 pl-4 py-2 italic text-gray-700 bg-white rounded-r-lg mb-3">
                      "{testRecon.teacherComments.finalComment}"
                    </blockquote>
                  )}
                  {testRecon.teacherComments.marginNotes?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-blue-700">{pt.marginNotes}</p>
                      <ul className="text-sm text-gray-600 space-y-1 mt-1">
                        {testRecon.teacherComments.marginNotes.map((note: string, i: number) => (
                          <li key={i}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {testRecon.teacherComments.overallTone && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-blue-700">{pt.overallTone}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${testRecon.teacherComments.overallTone === 'encouraging' ? 'bg-green-100 text-green-700' :
                        testRecon.teacherComments.overallTone === 'critical' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {testRecon.teacherComments.overallTone === 'encouraging' ? (pt.encouraging) :
                          testRecon.teacherComments.overallTone === 'critical' ? (pt.criticalTone) :
                            testRecon.teacherComments.overallTone === 'mixed' ? (pt.mixed) : (pt.neutral)}
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
                  {pt.potentialRecovery}
                </h4>
                <p className="text-lg font-bold text-green-600 mb-4">
                  {pt.estimatedPotential} {analysis.totalPotentialRecovery || '—'}
                </p>

                <div className="space-y-3">
                  {analysis.pointRecoveryOpportunities.map((opp: any, i: number) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-gray-800">{opp.question}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${opp.strength === 'strong' ? 'bg-green-100 text-green-700' :
                          opp.strength === 'moderate' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                          {opp.strength === 'strong' ? (pt.strongArgument) :
                            opp.strength === 'moderate' ? (pt.moderateArgument) : (pt.weakArgument)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="text-gray-500">{pt.current} {opp.currentPoints}P</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600 font-medium">{pt.possible} {opp.possiblePoints}P</span>
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
              <h4 className="font-bold text-gray-800 mb-3">{pt.recommendation}</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {analysis.recommendation.shouldContactTeacher ? (
                    <span className="flex items-center gap-2 text-blue-600 font-medium">
                      <CheckCircle className="h-5 w-5" />
                      {pt.contactTeacherRecommended}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle className="h-5 w-5" />
                      {pt.noContactNeeded}
                    </span>
                  )}
                  {analysis.recommendation.urgency && (
                    <span className={`text-xs px-2 py-0.5 rounded ${analysis.recommendation.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      analysis.recommendation.urgency === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                      {analysis.recommendation.urgency === 'high' ? (pt.highUrgency) :
                        analysis.recommendation.urgency === 'medium' ? (pt.mediumUrgency) : (pt.lowUrgency)}
                    </span>
                  )}
                </div>

                {/* Sample opener */}
                {analysis.recommendation.sampleOpener && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs font-medium text-blue-700 mb-1">{pt.conversationOpener}</p>
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
                    <p className="text-sm font-medium text-gray-700 mb-2">{pt.talkingPoints}</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                      {(analysis.recommendation.specificPoints || analysis.recommendation.questionsToAsk || []).map((q: string, i: number) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.recommendation.whatToAvoid?.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700 mb-1">{pt.avoidThis}</p>
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
              <span className="text-green-800">{pt.recoverablePoints}</span>
              <span className="text-xl font-bold text-green-600">{analysis.potentialPointsRecoverable}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => printSectionOnly('fairness')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              {pt.print}
            </button>
            <button
              onClick={() => {
                if (NON_LATIN_LANGS.includes(uiLang)) {
                  printSectionOnly('fairness')
                } else {
                  try {
                    generateFairnessPDF(fairnessData, {
                      childName,
                      subject: analysisData?.test?.subject,
                    })
                  } catch (err) {
                    console.error('Fairness PDF generation failed:', err)
                    alert('PDF konnte nicht erstellt werden. Bitte versuche es erneut.')
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              {pt.downloadPDF}
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center">
            {analysis?.disclaimer || pt.disclaimer}
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
  const { language: uiLang } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)
  const [learningMaterial, setLearningMaterial] = useState<any>(cachedData || null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'analysis' | 'lessons' | 'worksheets' | 'quizzes'>('analysis')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [generationProgress, setGenerationProgress] = useState<string>('')

  const { t, language: globalLang } = useLanguage()
  const pt = getPremiumTranslation(globalLang)

  const generateLearningMaterial = async () => {
    setIsGenerating(true)
    setError(null)
    setGenerationProgress(pt.analyzingTest)

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
      setError(err instanceof Error ? err.message : ('An error occurred'))
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
        title={pt.personalizedLearningMaterial}
        description={`Unlock personalized learning material for ${childName || (language === 'de' ? 'Ihr Kind' : 'your child')}`}
        icon={GraduationCap}
        previewContent={previewContent}
        stats={[
          { label: pt.materialsCreated, value: FOMO_STATS.learningMaterialsGenerated.toLocaleString() },
          { label: pt.avgGradeImprovement, value: `+${FOMO_STATS.avgGradeImprovement}` },
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
              {pt.learningMaterial}
              <PremiumBadge size="sm" />
            </h3>
            <p className="text-sm text-gray-600">{`Personalized learning material for ${childName || (language === 'de' ? 'Ihr Kind' : 'your child')}`}</p>
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
                {generationProgress || (pt.generatingMaterial)}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {pt.generateLearningMaterial}
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
                {pt.learningPlanOverview}
              </h4>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 mb-1">{pt.estimatedLearningTime}</div>
                  <div className="font-bold text-gray-800">{learningMaterial.learningPlan.analysis.estimatedLearningTime}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 mb-1">{pt.difficultyLevel}</div>
                  <div className="font-bold text-gray-800 capitalize">{learningMaterial.learningPlan.analysis.difficultyLevel}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600 mb-1">{pt.focusAreas}</div>
                  <div className="font-bold text-gray-800">{learningMaterial.learningPlan.analysis.primaryWeaknesses?.length || 0}</div>
                </div>
              </div>
              {learningMaterial.learningPlan.learningPath && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 font-medium min-w-[80px]">{pt.immediately}</span>
                    <span className="text-gray-600">{learningMaterial.learningPlan.learningPath.immediate}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 font-medium min-w-[80px]">{pt.thisWeek}</span>
                    <span className="text-gray-600">{learningMaterial.learningPlan.learningPath.shortTerm}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-600 font-medium min-w-[80px]">{pt.thisMonth}</span>
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
                  <p className="font-medium text-purple-800">{'Independent AI Analysis'}</p>
                  <p className="text-sm text-purple-600">
                    {learningMaterial.metadata.weaknessesFound} {pt.weaknessesDetected}
                    {' '}&bull;{' '}
                    {learningMaterial.metadata.curriculumTopicsMatched} {pt.curriculumTopicsMatched}
                    {' '}&bull;{' '}
                    {'Generated in'} {learningMaterial.metadata.totalGenerationTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-purple-200 pb-2 overflow-x-auto">
            {[
              ...(learningMaterial.independentAnalysis ? [{ id: 'analysis' as const, icon: Brain, label: pt.analysis, count: learningMaterial.independentAnalysis?.detectedWeaknesses?.length || 0 }] : []),
              { id: 'lessons' as const, icon: BookOpen, label: pt.lessons, count: learningMaterial.lessons?.lessons?.length || 0 },
              { id: 'worksheets' as const, icon: FileText, label: pt.worksheets, count: learningMaterial.worksheets?.worksheets?.length || 0 },
              { id: 'quizzes' as const, icon: ClipboardCheck, label: pt.quizzes, count: learningMaterial.quizzes?.quizzes?.length || 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === tab.id
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
                      {pt.overallAssessment}
                    </h4>
                    <p className="text-gray-700">{learningMaterial.independentAnalysis.overallAssessment}</p>
                  </div>
                )}

                {/* Detected Weaknesses */}
                {learningMaterial.independentAnalysis.detectedWeaknesses?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      {pt.detectedWeaknesses} ({learningMaterial.independentAnalysis.detectedWeaknesses.length})
                    </h4>
                    <div className="space-y-3">
                      {learningMaterial.independentAnalysis.detectedWeaknesses.map((w: any, i: number) => (
                        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleExpand(`weakness-${i}`)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${w.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                w.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                  w.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {w.severity === 'critical' ? ('Critical') :
                                  w.severity === 'high' ? (pt.high) :
                                    w.severity === 'medium' ? ('Medium') : (pt.low)}
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
                                  <span className="text-xs font-medium text-red-700">{pt.rootCause} </span>
                                  <span className="text-sm text-red-600">{w.rootCause}</span>
                                </div>
                              )}
                              {w.evidenceFromTest && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="text-xs font-medium text-gray-500">{pt.evidenceFromTest} </span>
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
                      {pt.teacherFeedbackAnalysis}
                    </h4>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
                      {learningMaterial.independentAnalysis.teacherFeedback.mainComments?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-1">{pt.mainComments}</p>
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
                          <p className="text-sm font-medium text-blue-800 mb-1">{pt.correctionPatterns}</p>
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
                          <span className="text-sm font-medium text-blue-800">{pt.tone}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'encouraging' ? 'bg-green-100 text-green-700' :
                            learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'critical' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'encouraging' ? ('Encouraging') :
                              learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'critical' ? ('Critical') :
                                learningMaterial.independentAnalysis.teacherFeedback.overallTone === 'mixed' ? ('Mixed') : ('Neutral')}
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
                      {pt.recognizedStrengths}
                    </h4>
                    <div className="space-y-2">
                      {learningMaterial.independentAnalysis.strengths.map((s: any, i: number) => (
                        <div key={i} className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="font-medium text-green-800">{s.title}</p>
                          {s.evidence && (
                            <p className="text-sm text-green-600 mt-1">{pt.evidence} {s.evidence}</p>
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
                      {pt.prioritizedNeeds}
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
                          <p className="text-sm text-gray-500">{pt.target} {lesson.targetWeakness}</p>
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
                              <span className={`text-xs px-2 py-1 rounded-full ${lesson.difficulty === 'foundation' ? 'bg-green-100 text-green-700' :
                                lesson.difficulty === 'mastery' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                {lesson.difficulty === 'foundation' ? (pt.foundation) :
                                  lesson.difficulty === 'mastery' ? (pt.mastery) : (pt.building)}
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
                            <div className="text-sm font-medium text-amber-700 mb-1">📝 {pt.prerequisiteCheck}</div>
                            <p className="text-sm text-amber-600">
                              {typeof lesson.prerequisiteCheck === 'string'
                                ? lesson.prerequisiteCheck
                                : lesson.prerequisiteCheck.question}
                            </p>
                            {lesson.prerequisiteCheck.expectedAnswer && (
                              <p className="text-xs text-amber-500 mt-1">{pt.expectedAnswer} {lesson.prerequisiteCheck.expectedAnswer}</p>
                            )}
                            {lesson.prerequisiteCheck.ifFailed && (
                              <p className="text-xs text-red-500 mt-1">{pt.ifFailed} {lesson.prerequisiteCheck.ifFailed}</p>
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
                            <div className="text-sm font-medium text-purple-700 mb-2">🔑 {pt.keyRules}</div>
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
                            <div className="text-sm font-medium text-blue-700 mb-2">📖 {pt.example} {j + 1}:</div>
                            <p className="text-sm text-gray-700 mb-2"><strong>{pt.task}</strong> {example.problem}</p>
                            <div className="space-y-1 mb-2">
                              {example.steps?.map((step: string, k: number) => (
                                <p key={k} className="text-sm text-gray-600">
                                  <span className="font-medium">{pt.step} {k + 1}:</span> {step}
                                </p>
                              ))}
                            </div>
                            <p className="text-sm text-green-700"><strong>{pt.solution}</strong> {example.solution}</p>
                            {example.commonMistake && (
                              <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                                ⚠️ {pt.commonMistake} {example.commonMistake}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* Example Walkthrough (old format fallback) */}
                        {!lesson.content?.workedExamples && lesson.exampleWalkthrough && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="text-sm font-medium text-blue-700 mb-2">📖 {'Example'}:</div>
                            <p className="text-sm text-gray-700 mb-2"><strong>{'Task:'}</strong> {lesson.exampleWalkthrough.problem}</p>
                            <div className="space-y-1 mb-2">
                              {lesson.exampleWalkthrough.steps?.map((step: string, j: number) => (
                                <p key={j} className="text-sm text-gray-600">
                                  <span className="font-medium">{'Step'} {j + 1}:</span> {step}
                                </p>
                              ))}
                            </div>
                            <p className="text-sm text-green-700"><strong>{'Solution:'}</strong> {lesson.exampleWalkthrough.solution}</p>
                          </div>
                        )}

                        {/* Practice Problems (new format) */}
                        {lesson.content?.practiceProblems?.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <div className="text-sm font-medium text-green-700 mb-2">✏️ {pt.practiceProblems}</div>
                            <div className="space-y-2">
                              {lesson.content.practiceProblems.map((prob: any, j: number) => (
                                <div key={j} className="bg-white rounded p-2 border border-green-100">
                                  <p className="text-sm text-gray-700">{j + 1}. {prob.question}</p>
                                  {prob.hint && (
                                    <p className="text-xs text-amber-600 mt-1">💡 {pt.hint} {prob.hint}</p>
                                  )}
                                  <button
                                    onClick={() => toggleExpand(`practice-${i}-${j}`)}
                                    className="text-xs text-blue-600 hover:underline mt-1"
                                  >
                                    {expandedItems.has(`practice-${i}-${j}`) ? (pt.hideAnswer) : (pt.showAnswer)}
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
                            <div className="text-sm font-medium text-yellow-700">💡 {pt.memoryAids}</div>
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
                            <div className="text-sm font-medium text-yellow-700">💡 {pt.memoryAid}</div>
                            <p className="text-sm text-gray-600">{lesson.memoryTrick}</p>
                          </div>
                        )}

                        {/* Real World Connection (old format fallback) */}
                        {!lesson.memoryAids && lesson.realWorldConnection && (
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">🌍 {pt.inEverydayLife}</span> {lesson.realWorldConnection}
                          </div>
                        )}

                        {/* Parent Guidance (new format) */}
                        {lesson.parentGuidance && (
                          <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
                            <div className="text-sm font-medium text-pink-700 mb-1">👨‍👩‍👧 {pt.parentTip}</div>
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
                            <span className={`px-2 py-0.5 rounded text-xs ${worksheet.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                              worksheet.difficulty === 'advanced' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                              {worksheet.difficulty === 'beginner' ? (pt.beginner) :
                                worksheet.difficulty === 'advanced' ? (pt.advanced) : (pt.intermediate)}
                            </span>
                            <span>• {worksheet.estimatedTime}</span>
                            <span>• {worksheet.problems?.length || 0} {pt.tasks}</span>
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
                                <span className="font-medium text-gray-800">{'Task'} {problem.number}</span>
                                <span className="text-xs text-gray-400">{problem.points} {'Points'}</span>
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
                                  💡 {'Hint:'} {problem.hint}
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
                              {expandedItems.has(`answers-${i}`) ? (pt.hideSolutions) : (pt.showSolutions)}
                              {expandedItems.has(`answers-${i}`) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            {expandedItems.has(`answers-${i}`) && (
                              <div className="mt-2 bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="space-y-2">
                                  {worksheet.answerKey.map((ans: any, j: number) => (
                                    <div key={j} className="text-sm">
                                      <span className="font-medium text-gray-700">{'Task'} {ans.number}:</span>{' '}
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
                            <div className="text-sm font-medium text-purple-700 mb-1">⭐ {pt.bonusChallenge}</div>
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
                            <span>• {quiz.questions?.length || 0} {pt.questions}</span>
                            <span>• {pt.passing} {quiz.passingScore}%</span>
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
                                <span className="font-medium text-gray-800">{pt.question} {q.number}</span>
                                <span className="text-xs text-gray-400">{q.points} {'Points'}</span>
                              </div>
                              <p className="text-gray-700 mb-3">{q.question}</p>

                              {/* Options */}
                              {q.options && (
                                <div className="space-y-2 ml-2">
                                  {q.options.map((opt: string, k: number) => (
                                    <div key={k} className="flex items-center gap-2 text-sm">
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${opt === q.correctAnswer ? 'border-green-500 bg-green-50' : 'border-gray-300'
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
                                    ⚠️ {'Common Mistake:'} {q.commonMistake}
                                  </div>
                                )}
                                {q.feedbackIfWrong && (
                                  <div className="bg-red-50 p-2 rounded text-red-700">
                                    ❌ {pt.ifWrong} {q.feedbackIfWrong}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Scoring Guide */}
                        {quiz.scoringGuide && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">📊 {pt.scoring}</div>
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
                {pt.curriculumTopics}
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
              {'Print'}
            </button>
            <button
              onClick={() => generateLearningMaterialPDF(learningMaterial, {
                childName,
                subject: analysisData?.test?.subject,
              })}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              {pt.downloadPDF}
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
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 border-2 border-white" />
                ))}
              </div>
              <span className="text-sm text-gray-600">+<AnimatedCounter end={FOMO_STATS.upgradesThisWeek} /> diese Woche</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(i => (
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
