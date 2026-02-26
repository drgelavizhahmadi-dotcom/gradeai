/**
 * Premium section translations for PremiumFeatures.tsx
 * Separate from the global Translations interface to avoid breaking the strict type system.
 * Follows the same pattern as useReportTranslation.ts
 */

export interface PremiumTranslations {
  // Shared
  personalizedFlashcards: string
  tailoredFor: (name: string) => string
  generateFlashcards: string
  creatingCards: string
  studyPlan: string
  dailyGoal: string
  totalTime: string
  review: string
  easy: string
  medium: string
  hard: string
  clickToFlip: string
  forLabel: string
  answer: string
  print: string
  downloadPDF: string
  anErrorOccurred: string

  // Flashcards locked
  flashcardsLockedDesc: (count: number, name: string) => string
  cardsCreated: string
  gradeImprovement: string

  // Fairness Check
  fairnessCheck: string
  fairnessCheckDesc: string
  checkFairness: string
  analyzingIndependently: string
  independentAIAnalysis: string
  questionsAnalyzed: string
  concernsFound: string
  generatedIn: string
  fairnessScore: string
  checksPerformed: string
  parentsSatisfied: string
  fair: string
  mostlyFair: string
  someConcerns: string
  questionable: string
  needsReview: string
  notAssessable: string

  // Fairness dimensions
  gradingConsistency: string
  pointProportionality: string
  partialCredit: string
  clarityOfExpectations: string
  feedbackQuality: string
  mathematicalAccuracy: string
  consistency: string
  clarity: string
  proportionality: string
  dimensions: string
  detailedAnalysis: string
  positiveFindings: string
  concerns: string
  evidence: string
  pointsAffected: string
  critical: string
  significant: string
  moderate: string
  minor: string

  // Grade boundary
  gradeBoundaryAnalysis: string
  currentGrade: string
  achieved: string
  recoverable: string
  gradeChangePossible: string
  yes: string
  no: string

  // Tabs
  overview: string
  reconstruction: string
  details: string
  actionPlan: string

  // Test reconstruction
  testOverview: string
  subject: string
  type: string
  points: string
  grade: string
  pointCalculationDiscrepancy: string
  teacher: string
  calculated: string
  taskReconstruction: string
  correct: string
  partial: string
  wrong: string
  studentAnswer: string
  teacherCorrection: string
  reasonForDeduction: string
  teacherComments: string
  marginNotes: string
  overallTone: string
  encouraging: string
  criticalTone: string
  mixed: string
  neutral: string

  // Recovery
  potentialRecovery: string
  estimatedPotential: string
  strongArgument: string
  moderateArgument: string
  weakArgument: string
  current: string
  possible: string

  // Recommendation
  recommendation: string
  contactTeacherRecommended: string
  noContactNeeded: string
  highUrgency: string
  mediumUrgency: string
  lowUrgency: string
  conversationOpener: string
  talkingPoints: string
  avoidThis: string
  recoverablePoints: string
  disclaimer: string

  // Learning Material
  learningMaterial: string
  personalizedLearningMaterial: string
  learningMaterialFor: (name: string) => string
  generateLearningMaterial: string
  generatingMaterial: string
  analyzingTest: string
  materialsCreated: string
  avgGradeImprovement: string

  // Learning plan
  learningPlanOverview: string
  estimatedLearningTime: string
  difficultyLevel: string
  focusAreas: string
  immediately: string
  thisWeek: string
  thisMonth: string
  weaknessesDetected: string
  curriculumTopicsMatched: string

  // Analysis tab
  overallAssessment: string
  detectedWeaknesses: string
  high: string
  low: string
  rootCause: string
  evidenceFromTest: string
  teacherFeedbackAnalysis: string
  mainComments: string
  correctionPatterns: string
  tone: string
  recognizedStrengths: string
  prioritizedNeeds: string
  curriculumTopics: string

  // Lessons tab
  analysis: string
  lessons: string
  worksheets: string
  quizzes: string
  target: string
  foundation: string
  building: string
  mastery: string
  prerequisiteCheck: string
  expectedAnswer: string
  ifFailed: string
  keyRules: string
  example: string
  task: string
  step: string
  solution: string
  commonMistake: string
  practiceProblems: string
  hint: string
  showAnswer: string
  hideAnswer: string
  memoryAids: string
  memoryAid: string
  inEverydayLife: string
  parentTip: string

  // Worksheets tab
  beginner: string
  intermediate: string
  advanced: string
  tasks: string
  showSolutions: string
  hideSolutions: string
  bonusChallenge: string

  // Quizzes tab
  questions: string
  passing: string
  question: string
  ifWrong: string
  scoring: string

  // Upgrade modal
  unlockWithPrime: string
  upgradeToPrime: string
  discountToday: string
  bestForYourChild: string
  unlimitedFlashcards: string
  fairnessCheckEvery: string
  aiLearningMaterial: string
  detailedProgress: string
  prioritySupport: string
  pdfExport: string
  offerEndsSoon: string
  timeRemaining: string
  becomePrime: string
  cancelAnytime: string
  thisWeekStat: string
  satisfiedParents: string
  perMonth: string

  // Locked feature
  fairnessLockedTitle: string
  fairnessLockedDesc: string
  learningLockedDesc: (name: string) => string
}

const de: PremiumTranslations = {
  personalizedFlashcards: 'Personalisierte Lernkarten',
  tailoredFor: (name) => `Maßgeschneidert für ${name || 'Ihr Kind'}`,
  generateFlashcards: 'Lernkarten erstellen',
  creatingCards: 'Karten werden erstellt...',
  studyPlan: 'Lernplan',
  dailyGoal: 'Tagesziel:',
  totalTime: 'Gesamtzeit:',
  review: 'Wiederholung:',
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
  clickToFlip: 'Zum Umdrehen klicken',
  forLabel: 'Für:',
  answer: 'Antwort',
  print: 'Drucken',
  downloadPDF: 'PDF herunterladen',
  anErrorOccurred: 'Ein Fehler ist aufgetreten',
  flashcardsLockedDesc: (count, name) => `${count}+ Lernkarten speziell für ${name || 'Ihr Kind'} basierend auf den Testschwächen`,
  cardsCreated: 'Karten erstellt',
  gradeImprovement: 'Notenverbesserung',

  fairnessCheck: 'Fairness-Check',
  fairnessCheckDesc: 'Unabhängige Bewertungsanalyse entdecken',
  checkFairness: 'Fairness prüfen',
  analyzingIndependently: 'Unabhängig analysieren...',
  independentAIAnalysis: 'Unabhängige KI-Analyse',
  questionsAnalyzed: 'Fragen analysiert',
  concernsFound: 'Bedenken gefunden',
  generatedIn: 'Erstellt in',
  fairnessScore: 'Fairness-Bewertung',
  checksPerformed: 'Überprüfungen durchgeführt',
  parentsSatisfied: 'Eltern zufrieden',
  fair: 'Fair',
  mostlyFair: 'Überwiegend fair',
  someConcerns: 'Einige Bedenken',
  questionable: 'Fragwürdig',
  needsReview: 'Überprüfung empfohlen',
  notAssessable: 'Nicht bewertbar',

  gradingConsistency: 'Bewertungskonsistenz',
  pointProportionality: 'Punkteverhältnis',
  partialCredit: 'Teilpunkte',
  clarityOfExpectations: 'Klarheit der Erwartungen',
  feedbackQuality: 'Feedbackqualität',
  mathematicalAccuracy: 'Mathematische Genauigkeit',
  consistency: 'Konsistenz',
  clarity: 'Klarheit',
  proportionality: 'Verhältnismäßigkeit',
  dimensions: 'Dimensionen',
  detailedAnalysis: 'Detaillierte Analyse',
  positiveFindings: 'Positive Ergebnisse',
  concerns: 'Bedenken',
  evidence: 'Nachweis:',
  pointsAffected: 'Betroffene Punkte:',
  critical: 'Kritisch',
  significant: 'Erheblich',
  moderate: 'Mäßig',
  minor: 'Gering',

  gradeBoundaryAnalysis: 'Notengrenzen-Analyse',
  currentGrade: 'Aktuelle Note',
  achieved: 'Erreicht',
  recoverable: 'Rückholbar',
  gradeChangePossible: 'Notenänderung möglich',
  yes: 'Ja',
  no: 'Nein',

  overview: 'Übersicht',
  reconstruction: 'Rekonstruktion',
  details: 'Details',
  actionPlan: 'Maßnahmenplan',

  testOverview: 'Testübersicht',
  subject: 'Fach',
  type: 'Typ',
  points: 'Punkte',
  grade: 'Note',
  pointCalculationDiscrepancy: 'Punkteberechnungs-Diskrepanz gefunden',
  teacher: 'Lehrer',
  calculated: 'Berechnet',
  taskReconstruction: 'Aufgaben-Rekonstruktion',
  correct: 'Richtig',
  partial: 'Teilweise',
  wrong: 'Falsch',
  studentAnswer: 'Schülerantwort',
  teacherCorrection: 'Lehrerkorrektur',
  reasonForDeduction: 'Abzugsgrund',
  teacherComments: 'Lehrerkommentare',
  marginNotes: 'Randnotizen',
  overallTone: 'Gesamtton',
  encouraging: 'Ermutigend',
  criticalTone: 'Kritisch',
  mixed: 'Gemischt',
  neutral: 'Neutral',

  potentialRecovery: 'Mögliche Rückgewinnung',
  estimatedPotential: 'Geschätztes Potenzial:',
  strongArgument: 'Starkes Argument',
  moderateArgument: 'Mäßiges Argument',
  weakArgument: 'Schwaches Argument',
  current: 'Aktuell',
  possible: 'Möglich',

  recommendation: 'Empfehlung',
  contactTeacherRecommended: 'Kontakt mit Lehrer empfohlen',
  noContactNeeded: 'Kein Kontakt nötig',
  highUrgency: 'Hohe Dringlichkeit',
  mediumUrgency: 'Mittlere Dringlichkeit',
  lowUrgency: 'Niedrige Dringlichkeit',
  conversationOpener: 'Gesprächseröffnung:',
  talkingPoints: 'Gesprächspunkte:',
  avoidThis: 'Dies vermeiden:',
  recoverablePoints: 'Rückholbare Punkte:',
  disclaimer: 'Haftungsausschluss: Diese Analyse ist ein KI-basiertes Werkzeug und ersetzt keine professionelle Beratung.',

  learningMaterial: 'Lernmaterial',
  personalizedLearningMaterial: 'Personalisiertes Lernmaterial',
  learningMaterialFor: (name) => `Personalisiertes Lernmaterial für ${name || 'Ihr Kind'}`,
  generateLearningMaterial: 'Lernmaterial erstellen',
  generatingMaterial: 'Material wird erstellt...',
  analyzingTest: 'Test wird analysiert...',
  materialsCreated: 'Materialien erstellt',
  avgGradeImprovement: 'Durchschn. Notenverbesserung',

  learningPlanOverview: 'Lernplan-Übersicht',
  estimatedLearningTime: 'Geschätzte Lernzeit',
  difficultyLevel: 'Schwierigkeitsgrad',
  focusAreas: 'Schwerpunkte',
  immediately: 'Sofort:',
  thisWeek: 'Diese Woche:',
  thisMonth: 'Diesen Monat:',
  weaknessesDetected: 'Schwächen erkannt',
  curriculumTopicsMatched: 'Lehrplanthemen zugeordnet',

  overallAssessment: 'Gesamtbewertung',
  detectedWeaknesses: 'Erkannte Schwächen',
  high: 'Hoch',
  low: 'Niedrig',
  rootCause: 'Ursache:',
  evidenceFromTest: 'Nachweis aus dem Test:',
  teacherFeedbackAnalysis: 'Lehrer-Feedback-Analyse',
  mainComments: 'Hauptkommentare',
  correctionPatterns: 'Korrekturmuster',
  tone: 'Ton:',
  recognizedStrengths: 'Erkannte Stärken',
  prioritizedNeeds: 'Priorisierte Bedürfnisse',
  curriculumTopics: 'Lehrplanthemen',

  analysis: 'Analyse',
  lessons: 'Lektionen',
  worksheets: 'Arbeitsblätter',
  quizzes: 'Quizze',
  target: 'Ziel:',
  foundation: 'Grundlagen',
  building: 'Aufbau',
  mastery: 'Meisterschaft',
  prerequisiteCheck: 'Voraussetzungsprüfung',
  expectedAnswer: 'Erwartete Antwort:',
  ifFailed: 'Bei Nichtbestehen:',
  keyRules: 'Wichtige Regeln',
  example: 'Beispiel',
  task: 'Aufgabe',
  step: 'Schritt',
  solution: 'Lösung:',
  commonMistake: 'Häufiger Fehler:',
  practiceProblems: 'Übungsaufgaben',
  hint: 'Hinweis:',
  showAnswer: 'Antwort anzeigen',
  hideAnswer: 'Antwort verbergen',
  memoryAids: 'Merkhilfen',
  memoryAid: 'Merkhilfe',
  inEverydayLife: 'Im Alltag:',
  parentTip: 'Tipp für Eltern:',

  beginner: 'Anfänger',
  intermediate: 'Fortgeschritten',
  advanced: 'Experte',
  tasks: 'Aufgaben',
  showSolutions: 'Lösungen anzeigen',
  hideSolutions: 'Lösungen verbergen',
  bonusChallenge: 'Bonus-Aufgabe',

  questions: 'Fragen',
  passing: 'Bestehen:',
  question: 'Frage',
  ifWrong: 'Bei Fehler:',
  scoring: 'Bewertung',

  unlockWithPrime: 'Freischalten mit Prime',
  upgradeToPrime: 'Auf Prime upgraden',
  discountToday: '-40% heute',
  bestForYourChild: 'Das Beste für Ihr Kind',
  unlimitedFlashcards: 'Unbegrenzte personalisierte Lernkarten',
  fairnessCheckEvery: 'Fairness-Check für jede Bewertung',
  aiLearningMaterial: 'KI-generiertes Lernmaterial (Lektionen, Arbeitsblätter, Quizze)',
  detailedProgress: 'Detaillierte Fortschrittsanalysen',
  prioritySupport: 'Prioritäts-Support',
  pdfExport: 'PDF-Export aller Berichte',
  offerEndsSoon: 'Angebot endet bald!',
  timeRemaining: 'Nur noch 23:47:12 verbleibend',
  becomePrime: 'Jetzt Prime werden',
  cancelAnytime: 'Jederzeit kündbar • 30 Tage Geld-zurück-Garantie',
  thisWeekStat: 'diese Woche',
  satisfiedParents: 'zufriedene Eltern',
  perMonth: '/Monat',

  fairnessLockedTitle: 'Fairness-Check',
  fairnessLockedDesc: 'Detaillierte Bewertung der Notengebung',
  learningLockedDesc: (name) => `KI-generierte Lektionen, Arbeitsblätter und Quizze für ${name || 'Ihr Kind'} – basierend auf dem deutschen Lehrplan`,
}

const en: PremiumTranslations = {
  personalizedFlashcards: 'Personalized Flashcards',
  tailoredFor: (name) => `Tailored for ${name || 'your child'}`,
  generateFlashcards: 'Generate Flashcards',
  creatingCards: 'Creating cards...',
  studyPlan: 'Study Plan',
  dailyGoal: 'Daily Goal:',
  totalTime: 'Total Time:',
  review: 'Review:',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  clickToFlip: 'Click to flip',
  forLabel: 'For:',
  answer: 'Answer',
  print: 'Print',
  downloadPDF: 'Download PDF',
  anErrorOccurred: 'An error occurred',
  flashcardsLockedDesc: (count, name) => `${count}+ flashcards tailored for ${name || 'your child'} based on test weaknesses`,
  cardsCreated: 'Cards created',
  gradeImprovement: 'Grade improvement',

  fairnessCheck: 'Fairness Check',
  fairnessCheckDesc: 'Discover any possible grading inconsistencies',
  checkFairness: 'Check Fairness',
  analyzingIndependently: 'Analyzing independently...',
  independentAIAnalysis: 'Independent AI Analysis',
  questionsAnalyzed: 'questions analyzed',
  concernsFound: 'concerns found',
  generatedIn: 'Generated in',
  fairnessScore: 'Fairness Score',
  checksPerformed: 'Checks Performed',
  parentsSatisfied: 'Parents Satisfied',
  fair: 'Fair',
  mostlyFair: 'Mostly Fair',
  someConcerns: 'Some Concerns',
  questionable: 'Questionable',
  needsReview: 'Needs Review',
  notAssessable: 'N/A',

  gradingConsistency: 'Grading Consistency',
  pointProportionality: 'Point Proportionality',
  partialCredit: 'Partial Credit',
  clarityOfExpectations: 'Clarity of Expectations',
  feedbackQuality: 'Feedback Quality',
  mathematicalAccuracy: 'Mathematical Accuracy',
  consistency: 'Consistency',
  clarity: 'Clarity',
  proportionality: 'Proportionality',
  dimensions: 'Dimensions',
  detailedAnalysis: 'Detailed Analysis',
  positiveFindings: 'Positive Findings',
  concerns: 'Concerns',
  evidence: 'Evidence:',
  pointsAffected: 'Points affected:',
  critical: 'Critical',
  significant: 'Significant',
  moderate: 'Moderate',
  minor: 'Minor',

  gradeBoundaryAnalysis: 'Grade Boundary Analysis',
  currentGrade: 'Current Grade',
  achieved: 'Achieved',
  recoverable: 'Recoverable',
  gradeChangePossible: 'Grade Change Possible',
  yes: 'Yes',
  no: 'No',

  overview: 'Overview',
  reconstruction: 'Reconstruction',
  details: 'Details',
  actionPlan: 'Action Plan',

  testOverview: 'Test Overview',
  subject: 'Subject',
  type: 'Type',
  points: 'Points',
  grade: 'Grade',
  pointCalculationDiscrepancy: 'Point Calculation Discrepancy Found',
  teacher: 'Teacher',
  calculated: 'Calculated',
  taskReconstruction: 'Task Reconstruction',
  correct: 'Correct',
  partial: 'Partial',
  wrong: 'Wrong',
  studentAnswer: 'Student Answer',
  teacherCorrection: 'Teacher Correction',
  reasonForDeduction: 'Reason for Deduction',
  teacherComments: 'Teacher Comments',
  marginNotes: 'Margin Notes',
  overallTone: 'Overall Tone',
  encouraging: 'Encouraging',
  criticalTone: 'Critical',
  mixed: 'Mixed',
  neutral: 'Neutral',

  potentialRecovery: 'Potential Recovery',
  estimatedPotential: 'Estimated Potential:',
  strongArgument: 'Strong Argument',
  moderateArgument: 'Moderate Argument',
  weakArgument: 'Weak Argument',
  current: 'Current',
  possible: 'Possible',

  recommendation: 'Recommendation',
  contactTeacherRecommended: 'Contact Teacher Recommended',
  noContactNeeded: 'No Contact Needed',
  highUrgency: 'High Urgency',
  mediumUrgency: 'Medium Urgency',
  lowUrgency: 'Low Urgency',
  conversationOpener: 'Conversation Opener:',
  talkingPoints: 'Talking Points:',
  avoidThis: 'Avoid This:',
  recoverablePoints: 'Recoverable Points:',
  disclaimer: 'Disclaimer: This analysis is an AI-based tool and does not replace professional advice.',

  learningMaterial: 'Learning Material',
  personalizedLearningMaterial: 'Personalized Learning Material',
  learningMaterialFor: (name) => `Personalized learning material for ${name || 'your child'}`,
  generateLearningMaterial: 'Generate Learning Material',
  generatingMaterial: 'Generating Material...',
  analyzingTest: 'Analyzing test...',
  materialsCreated: 'Materials Created',
  avgGradeImprovement: 'Avg. Grade Improvement',

  learningPlanOverview: 'Learning Plan Overview',
  estimatedLearningTime: 'Estimated Learning Time',
  difficultyLevel: 'Difficulty Level',
  focusAreas: 'Focus Areas',
  immediately: 'Immediately:',
  thisWeek: 'This Week:',
  thisMonth: 'This Month:',
  weaknessesDetected: 'weaknesses detected',
  curriculumTopicsMatched: 'curriculum topics matched',

  overallAssessment: 'Overall Assessment',
  detectedWeaknesses: 'Detected Weaknesses',
  high: 'High',
  low: 'Low',
  rootCause: 'Root Cause:',
  evidenceFromTest: 'Evidence from Test:',
  teacherFeedbackAnalysis: 'Teacher Feedback Analysis',
  mainComments: 'Main Comments',
  correctionPatterns: 'Correction Patterns',
  tone: 'Tone:',
  recognizedStrengths: 'Recognized Strengths',
  prioritizedNeeds: 'Prioritized Needs',
  curriculumTopics: 'Curriculum Topics',

  analysis: 'Analysis',
  lessons: 'Lessons',
  worksheets: 'Worksheets',
  quizzes: 'Quizzes',
  target: 'Target:',
  foundation: 'Foundation',
  building: 'Building',
  mastery: 'Mastery',
  prerequisiteCheck: 'Prerequisite Check',
  expectedAnswer: 'Expected Answer:',
  ifFailed: 'If Failed:',
  keyRules: 'Key Rules',
  example: 'Example',
  task: 'Task',
  step: 'Step',
  solution: 'Solution:',
  commonMistake: 'Common Mistake:',
  practiceProblems: 'Practice Problems',
  hint: 'Hint:',
  showAnswer: 'Show Answer',
  hideAnswer: 'Hide Answer',
  memoryAids: 'Memory Aids',
  memoryAid: 'Memory Aid',
  inEverydayLife: 'In Everyday Life:',
  parentTip: 'Parent Tip:',

  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  tasks: 'Tasks',
  showSolutions: 'Show Solutions',
  hideSolutions: 'Hide Solutions',
  bonusChallenge: 'Bonus Challenge',

  questions: 'Questions',
  passing: 'Passing:',
  question: 'Question',
  ifWrong: 'If Wrong:',
  scoring: 'Scoring',

  unlockWithPrime: 'Unlock with Prime',
  upgradeToPrime: 'Upgrade to Prime',
  discountToday: '-40% today',
  bestForYourChild: 'The best for your child',
  unlimitedFlashcards: 'Unlimited personalized flashcards',
  fairnessCheckEvery: 'Fairness check for every assessment',
  aiLearningMaterial: 'AI-generated learning material (lessons, worksheets, quizzes)',
  detailedProgress: 'Detailed progress analytics',
  prioritySupport: 'Priority support',
  pdfExport: 'PDF export of all reports',
  offerEndsSoon: 'Offer ends soon!',
  timeRemaining: 'Only 23:47:12 remaining',
  becomePrime: 'Become Prime Now',
  cancelAnytime: 'Cancel anytime • 30-day money-back guarantee',
  thisWeekStat: 'this week',
  satisfiedParents: 'satisfied parents',
  perMonth: '/month',

  fairnessLockedTitle: 'Fairness Check',
  fairnessLockedDesc: 'Detailed evaluation of grading fairness',
  learningLockedDesc: (name) => `AI-generated lessons, worksheets and quizzes tailored for ${name || 'your child'} – based on the German curriculum`,
}

// Helper to create translations for other languages based on English with overrides
function createTranslation(overrides: Partial<PremiumTranslations>): PremiumTranslations {
  return { ...en, ...overrides } as PremiumTranslations
}

const ar: PremiumTranslations = createTranslation({
  personalizedFlashcards: 'بطاقات تعليمية مخصصة',
  tailoredFor: (name) => `مصممة خصيصاً لـ ${name || 'طفلك'}`,
  generateFlashcards: 'إنشاء بطاقات تعليمية',
  creatingCards: 'جاري إنشاء البطاقات...',
  studyPlan: 'خطة الدراسة',
  dailyGoal: 'الهدف اليومي:',
  totalTime: 'الوقت الإجمالي:',
  review: 'المراجعة:',
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
  clickToFlip: 'انقر للقلب',
  forLabel: 'لـ:',
  answer: 'الإجابة',
  print: 'طباعة',
  downloadPDF: 'تحميل PDF',
  anErrorOccurred: 'حدث خطأ',
  flashcardsLockedDesc: (count, name) => `${count}+ بطاقة تعليمية مصممة لـ ${name || 'طفلك'} بناءً على نقاط الضعف`,
  cardsCreated: 'بطاقات تم إنشاؤها',
  gradeImprovement: 'تحسين الدرجة',
  fairnessCheck: 'فحص العدالة',
  fairnessCheckDesc: 'اكتشف أي تناقضات محتملة في التقييم',
  checkFairness: 'فحص العدالة',
  analyzingIndependently: 'جاري التحليل المستقل...',
  independentAIAnalysis: 'تحليل ذكاء اصطناعي مستقل',
  questionsAnalyzed: 'أسئلة تم تحليلها',
  concernsFound: 'مخاوف تم العثور عليها',
  generatedIn: 'تم إنشاؤه في',
  fairnessScore: 'درجة العدالة',
  checksPerformed: 'فحوصات تمت',
  parentsSatisfied: 'أولياء أمور راضون',
  fair: 'عادل',
  mostlyFair: 'عادل في الغالب',
  someConcerns: 'بعض المخاوف',
  questionable: 'مشكوك فيه',
  needsReview: 'يحتاج مراجعة',
  notAssessable: 'غير قابل للتقييم',
  dimensions: 'الأبعاد',
  positiveFindings: 'نتائج إيجابية',
  concerns: 'مخاوف',
  evidence: 'الدليل:',
  pointsAffected: 'النقاط المتأثرة:',
  critical: 'حرج',
  significant: 'كبير',
  moderate: 'متوسط',
  minor: 'بسيط',
  gradeBoundaryAnalysis: 'تحليل حدود الدرجات',
  currentGrade: 'الدرجة الحالية',
  achieved: 'المحقق',
  recoverable: 'قابل للاسترداد',
  gradeChangePossible: 'تغيير الدرجة ممكن',
  yes: 'نعم',
  no: 'لا',
  overview: 'نظرة عامة',
  reconstruction: 'إعادة بناء',
  details: 'تفاصيل',
  actionPlan: 'خطة العمل',
  testOverview: 'نظرة عامة على الاختبار',
  subject: 'المادة',
  type: 'النوع',
  points: 'النقاط',
  grade: 'الدرجة',
  recommendation: 'التوصية',
  learningMaterial: 'مواد تعليمية',
  personalizedLearningMaterial: 'مواد تعليمية مخصصة',
  learningMaterialFor: (name) => `مواد تعليمية مخصصة لـ ${name || 'طفلك'}`,
  generateLearningMaterial: 'إنشاء مواد تعليمية',
  generatingMaterial: 'جاري إنشاء المواد...',
  analyzingTest: 'جاري تحليل الاختبار...',
  analysis: 'تحليل',
  lessons: 'دروس',
  worksheets: 'أوراق عمل',
  quizzes: 'اختبارات',
  unlockWithPrime: 'فتح مع برايم',
  upgradeToPrime: 'الترقية إلى برايم',
  becomePrime: 'كن عضو برايم الآن',
  cancelAnytime: 'إلغاء في أي وقت • ضمان استرداد 30 يوم',
  fairnessLockedTitle: 'فحص العدالة',
  fairnessLockedDesc: 'تقييم تفصيلي لعدالة التقييم',
  learningLockedDesc: (name) => `دروس وأوراق عمل واختبارات مخصصة لـ ${name || 'طفلك'} – بناءً على المنهج الألماني`,
})

const fa: PremiumTranslations = createTranslation({
  personalizedFlashcards: 'کارت‌های آموزشی شخصی‌سازی‌شده',
  tailoredFor: (name) => `طراحی‌شده برای ${name || 'فرزند شما'}`,
  generateFlashcards: 'ایجاد کارت‌های آموزشی',
  creatingCards: 'در حال ایجاد کارت‌ها...',
  studyPlan: 'برنامه مطالعه',
  dailyGoal: 'هدف روزانه:',
  totalTime: 'زمان کل:',
  review: 'مرور:',
  easy: 'آسان',
  medium: 'متوسط',
  hard: 'سخت',
  clickToFlip: 'برای چرخش کلیک کنید',
  forLabel: 'برای:',
  answer: 'پاسخ',
  print: 'چاپ',
  downloadPDF: 'دانلود PDF',
  anErrorOccurred: 'خطایی رخ داد',
  fairnessCheck: 'بررسی عدالت',
  fairnessCheckDesc: 'ناسازگاری‌های احتمالی نمره‌دهی را کشف کنید',
  checkFairness: 'بررسی عدالت',
  analyzingIndependently: 'در حال تحلیل مستقل...',
  independentAIAnalysis: 'تحلیل مستقل هوش مصنوعی',
  fairnessScore: 'امتیاز عدالت',
  fair: 'عادلانه',
  mostlyFair: 'عمدتاً عادلانه',
  someConcerns: 'برخی نگرانی‌ها',
  questionable: 'قابل تردید',
  needsReview: 'نیاز به بررسی',
  overview: 'نمای کلی',
  details: 'جزئیات',
  recommendation: 'توصیه',
  learningMaterial: 'مواد آموزشی',
  personalizedLearningMaterial: 'مواد آموزشی شخصی‌سازی‌شده',
  learningMaterialFor: (name) => `مواد آموزشی شخصی‌سازی‌شده برای ${name || 'فرزند شما'}`,
  generateLearningMaterial: 'ایجاد مواد آموزشی',
  generatingMaterial: 'در حال ایجاد مواد...',
  analyzingTest: 'در حال تحلیل آزمون...',
  analysis: 'تحلیل',
  lessons: 'درس‌ها',
  worksheets: 'کاربرگ‌ها',
  quizzes: 'آزمون‌ها',
  unlockWithPrime: 'باز کردن با پرایم',
  upgradeToPrime: 'ارتقا به پرایم',
  becomePrime: 'همین الان عضو پرایم شوید',
  cancelAnytime: 'لغو در هر زمان • ضمانت برگشت وجه ۳۰ روزه',
  fairnessLockedTitle: 'بررسی عدالت',
  fairnessLockedDesc: 'ارزیابی دقیق عدالت نمره‌دهی',
  learningLockedDesc: (name) => `درس‌ها، کاربرگ‌ها و آزمون‌های طراحی‌شده برای ${name || 'فرزند شما'} – بر اساس برنامه درسی آلمان`,
})

const ku: PremiumTranslations = createTranslation({
  personalizedFlashcards: 'کارتی فێربوونی تایبەت',
  tailoredFor: (name) => `دروستکراوە بۆ ${name || 'منداڵەکەت'}`,
  generateFlashcards: 'دروستکردنی کارتی فێربوون',
  fairnessCheck: 'پشکنینی دادپەروەری',
  checkFairness: 'پشکنینی دادپەروەری',
  fairnessScore: 'نمرەی دادپەروەری',
  learningMaterial: 'بابەتی فێربوون',
  generateLearningMaterial: 'دروستکردنی بابەتی فێربوون',
  overview: 'پوختە',
  details: 'وردەکارییەکان',
  analysis: 'شیکردنەوە',
  lessons: 'وانەکان',
  worksheets: 'کاغەزی کار',
  quizzes: 'تاقیکردنەوەکان',
  unlockWithPrime: 'کردنەوە بە پرایم',
  becomePrime: 'ئێستا ببە ئەندامی پرایم',
})

const kmr: PremiumTranslations = createTranslation({
  personalizedFlashcards: 'Kartên hînbûnê yên kesane',
  tailoredFor: (name) => `Ji bo ${name || 'zarokê we'} hatiye çêkirin`,
  generateFlashcards: 'Kartên hînbûnê çêbikin',
  fairnessCheck: 'Kontrola dadmendiyê',
  checkFairness: 'Kontrola dadmendiyê',
  fairnessScore: 'Pûana dadmendiyê',
  learningMaterial: 'Materyalên hînbûnê',
  generateLearningMaterial: 'Materyalên hînbûnê çêbikin',
  overview: 'Berçav',
  details: 'Hûrgulî',
  analysis: 'Analîz',
  lessons: 'Ders',
  worksheets: 'Pelên xebatê',
  quizzes: 'Qîz',
  unlockWithPrime: 'Bi Prime vekin',
  becomePrime: 'Niha bibe endamê Prime',
})

const tr: PremiumTranslations = createTranslation({
  personalizedFlashcards: 'Kişiselleştirilmiş Bilgi Kartları',
  tailoredFor: (name) => `${name || 'Çocuğunuz'} için özel hazırlanmış`,
  generateFlashcards: 'Bilgi Kartları Oluştur',
  creatingCards: 'Kartlar oluşturuluyor...',
  studyPlan: 'Çalışma Planı',
  dailyGoal: 'Günlük Hedef:',
  totalTime: 'Toplam Süre:',
  review: 'Tekrar:',
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
  clickToFlip: 'Çevirmek için tıklayın',
  print: 'Yazdır',
  downloadPDF: 'PDF İndir',
  anErrorOccurred: 'Bir hata oluştu',
  fairnessCheck: 'Adalet Kontrolü',
  fairnessCheckDesc: 'Olası not tutarsızlıklarını keşfedin',
  checkFairness: 'Adaleti Kontrol Et',
  analyzingIndependently: 'Bağımsız olarak analiz ediliyor...',
  independentAIAnalysis: 'Bağımsız AI Analizi',
  fairnessScore: 'Adalet Puanı',
  fair: 'Adil',
  mostlyFair: 'Çoğunlukla Adil',
  someConcerns: 'Bazı Endişeler',
  questionable: 'Şüpheli',
  needsReview: 'İnceleme Gerekiyor',
  overview: 'Genel Bakış',
  details: 'Detaylar',
  recommendation: 'Öneri',
  learningMaterial: 'Öğrenme Materyali',
  personalizedLearningMaterial: 'Kişiselleştirilmiş Öğrenme Materyali',
  learningMaterialFor: (name) => `${name || 'Çocuğunuz'} için kişiselleştirilmiş öğrenme materyali`,
  generateLearningMaterial: 'Öğrenme Materyali Oluştur',
  generatingMaterial: 'Materyal oluşturuluyor...',
  analyzingTest: 'Test analiz ediliyor...',
  analysis: 'Analiz',
  lessons: 'Dersler',
  worksheets: 'Çalışma Yaprakları',
  quizzes: 'Sınavlar',
  unlockWithPrime: 'Prime ile Aç',
  upgradeToPrime: 'Prime\'a Yükselt',
  becomePrime: 'Şimdi Prime Üye Ol',
  cancelAnytime: 'İstediğiniz zaman iptal • 30 gün para iade garantisi',
})

const ro: PremiumTranslations = createTranslation({
  personalizedFlashcards: 'Carduri de Învățare Personalizate',
  tailoredFor: (name) => `Personalizat pentru ${name || 'copilul dumneavoastră'}`,
  generateFlashcards: 'Generează Carduri',
  fairnessCheck: 'Verificare Corectitudine',
  checkFairness: 'Verifică Corectitudinea',
  fairnessScore: 'Scor de Corectitudine',
  learningMaterial: 'Material de Învățare',
  generateLearningMaterial: 'Generează Material de Învățare',
  overview: 'Prezentare Generală',
  details: 'Detalii',
  analysis: 'Analiză',
  lessons: 'Lecții',
  worksheets: 'Fișe de Lucru',
  quizzes: 'Teste',
  unlockWithPrime: 'Deblocați cu Prime',
  becomePrime: 'Deveniți membru Prime acum',
})

const ru: PremiumTranslations = createTranslation({
  personalizedFlashcards: 'Персональные карточки',
  tailoredFor: (name) => `Создано для ${name || 'вашего ребёнка'}`,
  generateFlashcards: 'Создать карточки',
  creatingCards: 'Создание карточек...',
  studyPlan: 'План обучения',
  dailyGoal: 'Цель на день:',
  totalTime: 'Общее время:',
  review: 'Повторение:',
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
  clickToFlip: 'Нажмите чтобы перевернуть',
  print: 'Печать',
  downloadPDF: 'Скачать PDF',
  anErrorOccurred: 'Произошла ошибка',
  fairnessCheck: 'Проверка справедливости',
  fairnessCheckDesc: 'Обнаружьте возможные несоответствия в оценке',
  checkFairness: 'Проверить справедливость',
  analyzingIndependently: 'Независимый анализ...',
  independentAIAnalysis: 'Независимый анализ ИИ',
  fairnessScore: 'Оценка справедливости',
  fair: 'Справедливо',
  mostlyFair: 'В основном справедливо',
  someConcerns: 'Есть замечания',
  questionable: 'Сомнительно',
  needsReview: 'Требует проверки',
  overview: 'Обзор',
  details: 'Детали',
  recommendation: 'Рекомендация',
  learningMaterial: 'Учебный материал',
  personalizedLearningMaterial: 'Персональный учебный материал',
  learningMaterialFor: (name) => `Персональный учебный материал для ${name || 'вашего ребёнка'}`,
  generateLearningMaterial: 'Создать учебный материал',
  generatingMaterial: 'Создание материала...',
  analyzingTest: 'Анализ теста...',
  analysis: 'Анализ',
  lessons: 'Уроки',
  worksheets: 'Рабочие листы',
  quizzes: 'Тесты',
  unlockWithPrime: 'Разблокировать с Prime',
  upgradeToPrime: 'Обновить до Prime',
  becomePrime: 'Стать участником Prime',
  cancelAnytime: 'Отмена в любое время • 30-дневная гарантия возврата',
})

const premiumTranslations: Record<string, PremiumTranslations> = {
  de, en, ar, fa, ku, kmr, tr, ro, ru,
}

export function getPremiumTranslation(lang: string): PremiumTranslations {
  return premiumTranslations[lang] || premiumTranslations.en
}
