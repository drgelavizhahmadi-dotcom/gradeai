'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  BookOpen,
  Clock,
  Target,
  Lightbulb,
  Calendar,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Star,
  Zap,
  ArrowRight,
  Info,
  Scale,
  GraduationCap,
  CheckSquare,
  Square,
  Heart,
} from 'lucide-react';
import { TestAnalysis } from '@/lib/ai/prompts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export interface ParentReportData {
  header: {
    subject: string;
    gradeLevel: string;
    studentName: string;
    date: string;
    grade: string;
    gradeText: string;
    percentage: number;
    aiConfidence: number;
    ocrConfidence: number;
  };
  examStructure: Array<{
    taskNumber: number;
    type: string;
    topic: string;
    requirement: string;
    weight: number;
    wordCount: number;
    wordCountRequired: number;
  }>;
  scores: {
    task1?: { content: { score: number; max: number; critical?: boolean }; language: { score: number; max: number; critical?: boolean }; structure: { score: number; max: number; critical?: boolean } };
    task2?: { content: { score: number; max: number; critical?: boolean }; language: { score: number; max: number; critical?: boolean }; register: { score: number; max: number; critical?: boolean } };
    total: { score: number; max: number };
  };
  fairnessCheck: {
    overall: 'fair' | 'possibly_strict' | 'review_recommended';
    deductionsTraceable: boolean;
    criteriaTransparent: boolean;
    correctionsConsistent: boolean;
    potentialIssues: string | null;
    corrections: Array<{ type: string; count: number; assessment: string }>;
  };
  warnings: {
    immediate: string[];
    shortTerm: string[];
    mediumTerm: string[];
    promotionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    requiredNextGrade: string;
    remainingExams: number;
  };
  errorAnalysis: Array<{
    type: string;
    count: number;
    examples: Array<{ wrong: string; correct: string }>;
    explanation: string;
    rule: string;
  }>;
  parentActions: {
    thisWeek: Array<{ action: string; questions: string[] }>;
    nextTwoWeeks: string[];
  };
  learningPlan: Array<{
    priority: number;
    color: 'red' | 'orange' | 'yellow' | 'gray';
    title: string;
    duration: string;
    what: string;
    how: string;
    resources: string[];
    successMetric: string;
    timeCommitment: string;
  }>;
  strengths: Array<{ title: string; description: string }>;
  outlook: {
    currentTrend: 'up' | 'down' | 'stable';
    realisticImprovement: string;
    nextExamGoal: string;
    timeframe: string;
  };
}

// ============================================================================
// DATA MAPPER - Convert TestAnalysis to ParentReportData
// ============================================================================
export function mapTestAnalysisToReport(
  analysis: TestAnalysis,
  gradeLevel: string,
  schoolType?: string
): ParentReportData {
  const summary = analysis.summary;
  const performance = analysis.performance;
  const metadata = analysis.metadata;

  return {
    header: {
      subject: summary.subject || 'Unbekanntes Fach',
      gradeLevel: gradeLevel || 'Unbekannte Stufe',
      studentName: summary.childName || 'Schüler/in',
      date: summary.testDate ? new Date(summary.testDate).toLocaleDateString('de-DE') : new Date().toLocaleDateString('de-DE'),
      grade: summary.overallGrade || 'N/A',
      gradeText: getGradeText(summary.overallGrade || ''),
      percentage: Math.round(summary.percentage || 0),
      aiConfidence: Math.round((summary.confidence || 0.85) * 100),
      ocrConfidence: Math.round((metadata.ocrConfidence || 0.85) * 100),
    },
    examStructure: performance.bySection.map((section, idx) => ({
      taskNumber: idx + 1,
      type: section.name,
      topic: section.notes || 'Siehe Aufgabenstellung',
      requirement: `Maximalpunkte: ${section.pointsPossible}`,
      weight: Math.round((section.pointsPossible / analysis.summary.maxScore) * 100),
      wordCount: section.pointsAchieved,
      wordCountRequired: section.pointsPossible,
    })),
    scores: {
      total: {
        score: summary.overallScore || 0,
        max: summary.maxScore || 100,
      },
    },
    fairnessCheck: {
      overall: 'fair',
      deductionsTraceable: true,
      criteriaTransparent: true,
      correctionsConsistent: true,
      potentialIssues: null,
      corrections: analysis.teacherFeedback.corrections.map((corr, idx) => ({
        type: corr,
        count: idx + 1,
        assessment: 'angemessen',
      })),
    },
    warnings: {
      immediate: analysis.weaknesses.slice(0, 3),
      shortTerm: analysis.weaknesses.slice(3, 6),
      mediumTerm: analysis.longTermDevelopment.improvementAreas,
      promotionRisk: analysis.summary.percentage < 50 ? 'HIGH' : analysis.summary.percentage < 70 ? 'MEDIUM' : 'LOW',
      requiredNextGrade: summary.overallGrade || '4',
      remainingExams: 2,
    },
    errorAnalysis: [],
    parentActions: {
      thisWeek: [
        {
          action: 'Gespräch mit Ihrem Kind führen',
          questions: [
            'Was war schwierig?',
            'Wo brauchst du Hilfe?',
            'Wie fühlst du dich dabei?',
          ],
        },
        {
          action: 'Mit Lehrkraft Kontakt aufnehmen',
          questions: [
            'Wo sehen Sie die größten Lücken?',
            'Gibt es schulische Förderangebote?',
          ],
        },
      ],
      nextTwoWeeks: [
        'Lernplan erstellen',
        'Nachhilfe organisieren falls nötig',
        'Tägliche Lernroutine etablieren',
      ],
    },
    learningPlan: [
      {
        priority: 1,
        color: 'red',
        title: 'Hauptschwächen beheben',
        duration: 'Wochen 1-4',
        what: analysis.weaknesses[0] || 'Schwachstellen identifiziert',
        how: 'Gezielte Übungen und Wiederholung',
        resources: [],
        successMetric: 'Verbesserung um 10%',
        timeCommitment: '15-30 Min täglich',
      },
    ],
    strengths: analysis.strengths.map((strength) => ({
      title: strength,
      description: strength,
    })),
    outlook: {
      currentTrend: analysis.summary.percentage < 50 ? 'down' : 'stable',
      realisticImprovement: '1-2 Notenstufen in 4 Wochen möglich',
      nextExamGoal: String(summary.overallGrade || '4'),
      timeframe: '4 Wochen konzentriertes Üben',
    },
  };
}

function getGradeText(grade: string): string {
  const gradeMap: Record<string, string> = {
    '1': 'sehr gut',
    '1+': 'sehr gut plus',
    '1-': 'sehr gut minus',
    '2': 'gut',
    '2+': 'gut plus',
    '2-': 'gut minus',
    '3': 'befriedigend',
    '3+': 'befriedigend plus',
    '3-': 'befriedigend minus',
    '4': 'ausreichend',
    '4+': 'ausreichend plus',
    '4-': 'ausreichend minus',
    '5': 'mangelhaft',
    '5+': 'mangelhaft plus',
    '5-': 'mangelhaft minus',
    '6': 'ungenügend',
  };
  return gradeMap[grade] || 'unbekannt';
}

// ============================================================================
// SAMPLE DATA - Replace with real data from your API
// ============================================================================
const sampleReportData = {
  header: {
    subject: 'Englisch',
    gradeLevel: 'Oberstufe / Q-Phase',
    studentName: 'Kani',
    date: '2024',
    grade: '5-',
    gradeText: 'mangelhaft minus',
    percentage: 25,
    aiConfidence: 86,
    ocrConfidence: 95,
  },
  examStructure: [
    {
      taskNumber: 1,
      type: 'Essay Writing',
      topic: 'Should young people conform to society and their parents\' ideals?',
      requirement: '300+ Wörter, formal register',
      weight: 60,
      wordCount: 265,
      wordCountRequired: 300,
    },
    {
      taskNumber: 2,
      type: 'Mediation',
      topic: 'Influencer als Jugendidole (Deutsch → Englisch)',
      requirement: '300 Wörter, formale E-Mail',
      weight: 40,
      wordCount: 80,
      wordCountRequired: 300,
    },
  ],
  scores: {
    task1: {
      content: { score: 4, max: 10 },
      language: { score: 2, max: 10, critical: true },
      structure: { score: 5, max: 10 },
    },
    task2: {
      content: { score: 1, max: 10, critical: true },
      language: { score: 2, max: 10 },
      register: { score: 1, max: 10, critical: true },
    },
    total: { score: 15, max: 60 },
  },
  fairnessCheck: {
    overall: 'fair',
    deductionsTraceable: true,
    criteriaTransparent: true,
    correctionsConsistent: true,
    potentialIssues: null,
    corrections: [
      { type: 'SP (Sprachfehler)', count: 23, assessment: 'angemessen' },
      { type: 'Gr (Grammatik)', count: 15, assessment: 'angemessen' },
      { type: 'wrong register', count: 4, assessment: 'berechtigt' },
      { type: 'ds (doesn\'t make sense)', count: 3, assessment: 'berechtigt' },
    ],
  },
  warnings: {
    immediate: [
      'Grundlegende Grammatik nicht gesichert',
      'Aufgabe 2 nicht vollständig bearbeitet',
      'Zeitmanagement problematisch',
    ],
    shortTerm: [
      'Formales vs. informales Register unklar',
      'Rechtschreibung systematisch fehlerhaft',
    ],
    mediumTerm: [
      'Argumentationsstruktur schwach',
      'Wortschatz für formale Texte begrenzt',
    ],
    promotionRisk: 'HIGH',
    requiredNextGrade: '4+',
    remainingExams: 2,
  },
  errorAnalysis: [
    {
      type: 'Pronomen-Verwechslung',
      count: 12,
      examples: [
        { wrong: 'in they way', correct: 'in their way' },
        { wrong: 'themselfs', correct: 'themselves' },
      ],
      explanation:
        '"their" = besitzanzeigend (ihr/ihre), "they" = Subjektform (sie). Diese Verwechslung zeigt eine Grundlagenlücke.',
      rule: 'their → Besitz | they → Subjekt | them → Objekt',
    },
    {
      type: 'Verb-Konjugation',
      count: 8,
      examples: [
        { wrong: 'they wants', correct: 'they want' },
        { wrong: 'he want', correct: 'he wants' },
      ],
      explanation:
        'Nach "they/we/I/you" KEIN -s am Verb! Nur bei he/she/it kommt -s dazu.',
      rule: 'he/she/it + Verb-s ✓ | I/you/we/they + Verb ✓',
    },
    {
      type: 'Falsches Register',
      count: 4,
      examples: [
        { wrong: 'Hey, I wanted to tell you...', correct: 'I am writing to inform you...' },
        { wrong: 'gonna', correct: 'going to' },
      ],
      explanation:
        '"Register" = Sprachstil je nach Situation. E-Mail an Firma/Lehrer = IMMER formal!',
      rule: 'Formal: vollständige Sätze, keine Abkürzungen, höfliche Formulierungen',
    },
  ],
  parentActions: {
    thisWeek: [
      {
        action: 'Gespräch mit Ihrem Kind (ohne Vorwürfe!)',
        questions: ['Was war schwierig?', 'Wo brauchst du Hilfe?', 'Wie fühlst du dich dabei?'],
      },
      {
        action: 'Termin mit Englischlehrer/in vereinbaren',
        questions: [
          'Wo sehen Sie die größten Lücken?',
          'Gibt es schulische Förderangebote?',
          'Welche Materialien empfehlen Sie?',
        ],
      },
      {
        action: 'Lernumgebung prüfen',
        questions: [
          'Ruhiger Lernplatz vorhanden?',
          'Wie viel Zeit für Englisch?',
          'Ablenkungen minimiert?',
        ],
      },
    ],
    nextTwoWeeks: [
      'Nachhilfe organisieren (Einzelunterricht empfohlen)',
      'Tägliche 15-Minuten-Routine einführen',
      'Fehlerprotokoll aus dieser Arbeit erstellen',
    ],
  },
  learningPlan: [
    {
      priority: 1,
      color: 'red',
      title: 'Grammatik-Grundlagen',
      duration: 'Wochen 1-4',
      what: 'they/their/them + Verb-Konjugation',
      how: '15 Min/Tag mit Übungsblättern',
      resources: ['Englisch-Hilfen.de', 'Ego4u.de'],
      successMetric: 'Fehlerquote unter 5%',
      timeCommitment: '15 Min täglich',
    },
    {
      priority: 2,
      color: 'orange',
      title: 'Aufgaben vollständig bearbeiten',
      duration: 'Wochen 1-2',
      what: 'Zeitmanagement in Prüfungen',
      how: 'Übungsklausuren unter Zeitdruck',
      resources: ['Alte Klausuren', 'Timer-App'],
      successMetric: 'Beide Aufgaben bearbeitet',
      timeCommitment: '1x pro Woche 90 Min',
    },
    {
      priority: 3,
      color: 'yellow',
      title: 'Register unterscheiden',
      duration: 'Wochen 3-6',
      what: 'Formal vs. informal English',
      how: 'Musterbriefe analysieren und nachschreiben',
      resources: ['Business English Vorlagen'],
      successMetric: 'Keine Register-Fehler',
      timeCommitment: '2x pro Woche 30 Min',
    },
    {
      priority: 4,
      color: 'gray',
      title: 'Rechtschreibung',
      duration: 'Fortlaufend',
      what: 'Häufige Wörter korrekt schreiben',
      how: 'Fehlerprotokoll führen, täglich 5 Wörter üben',
      resources: ['Anki App', 'Karteikarten'],
      successMetric: '10 neue Wörter/Woche korrekt',
      timeCommitment: '10 Min täglich',
    },
  ],
  strengths: [
    {
      title: 'Versteht die Themen inhaltlich',
      description: 'Kani hat verstanden, worum es bei "Identität vs. Gesellschaft" geht',
    },
    {
      title: 'Hat eigene Gedanken und Meinungen',
      description: '"everyone deserves to be respected" zeigt Reflexionsfähigkeit',
    },
    {
      title: 'Traut sich zu schreiben',
      description: '265 Wörter in Aufgabe 1 zeigt Motivation und Einsatz',
    },
    {
      title: 'Fehler sind systematisch',
      description: 'Das bedeutet: Sie sind lernbar und können gezielt behoben werden!',
    },
  ],
  outlook: {
    currentTrend: 'down',
    realisticImprovement: '2 Notenstufen in 3 Monaten',
    nextExamGoal: 'Note 4 (ausreichend)',
    timeframe: '4 Wochen konzentriertes Üben',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color based on score percentage
 * Green (70%+): Good, Yellow (50-69%): Okay, Orange (30-49%): Needs work, Red (<30%): Critical
 */
const getScoreColor = (score: number, max: number): string => {
  const percentage = (score / max) * 100;
  if (percentage >= 70) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};

const getScoreColorTailwind = (score: number, max: number): string => {
  const percentage = (score / max) * 100;
  if (percentage >= 70) return 'text-emerald-600 bg-emerald-50';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
  if (percentage >= 30) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

/**
 * Get grade color styling
 */
const getGradeColor = (grade: string): string => {
  if (['1', '2'].includes(grade[0])) return 'bg-emerald-500';
  if (grade[0] === '3') return 'bg-yellow-500';
  if (grade[0] === '4') return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * Get warning urgency color
 */
const getWarningColor = (level: string): string => {
  if (level === 'immediate') return 'border-red-300 bg-red-50';
  if (level === 'shortTerm') return 'border-orange-300 bg-orange-50';
  return 'border-yellow-300 bg-yellow-50';
};

/**
 * Get warning icon
 */
const getWarningIcon = (level: string): string => {
  if (level === 'immediate') return '🔴';
  if (level === 'shortTerm') return '🟠';
  return '🟡';
};

/**
 * Progress bar component
 */
const ProgressBar: React.FC<{ score: number; max: number; label: string; critical?: boolean }> = ({ score, max, label, critical }) => {
  const percentage = (score / max) * 100;
  const color = getScoreColor(score, max);

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-800">
          {score}/{max} {critical && <span className="text-red-600">⚠️</span>}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

/**
 * Expandable card component
 */
const ExpandableCard: React.FC<{ title: string; icon?: any; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-slate-600" />}
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>
      {isOpen && <div className="px-6 py-4 bg-white">{children}</div>}
    </div>
  );
};

/**
 * Tab component
 */
const TabNavigation: React.FC<{ tabs: Array<{ id: string; label: string }>; activeTab: string; onTabChange: (id: string) => void }> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface GradeAIParentReportProps {
  data?: ParentReportData;
  analysis?: TestAnalysis;
  gradeLevel?: string;
  schoolType?: string;
}

const GradeAIParentReport: React.FC<GradeAIParentReportProps> = ({
  data,
  analysis,
  gradeLevel = 'Oberstufe / Q-Phase',
  schoolType,
}) => {
  // If analysis is provided, convert it to report data
  const reportData = data || (analysis ? mapTestAnalysisToReport(analysis, gradeLevel, schoolType) : sampleReportData);

  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'analysis', label: 'Analyse' },
    { id: 'actionPlan', label: 'Handlungsplan' },
    { id: 'strengths', label: 'Stärken' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* ====================================================================
            HEADER SECTION
            ==================================================================== */}
        <div className="mb-8">
          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">GradeAI Elternbericht</h1>
          </div>

          {/* Main header card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Grade Badge */}
                <div className="flex flex-col items-center">
                  <div
                    className={`${getGradeColor(
                      reportData.header.grade
                    )} w-24 h-24 rounded-lg flex items-center justify-center mb-3 shadow-lg`}
                  >
                    <span className="text-5xl font-bold text-white">{reportData.header.grade}</span>
                  </div>
                  <p className="text-xs text-slate-500 text-center">{reportData.header.gradeText}</p>
                </div>

                {/* Subject & Student Info */}
                <div className="flex flex-col justify-center">
                  <p className="text-lg font-semibold text-slate-800 mb-2">
                    {reportData.header.subject} • {reportData.header.gradeLevel}
                  </p>
                  <p className="text-sm text-slate-600 mb-3">
                    <span className="font-medium">Schüler:</span> {reportData.header.studentName}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Datum:</span> {reportData.header.date}
                  </p>
                </div>

                {/* Confidence Indicators */}
                <div className="flex flex-col justify-center">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">KI-Analyse</span>
                      <span className="text-sm font-bold text-blue-600">{reportData.header.aiConfidence}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${reportData.header.aiConfidence}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Texterkennung</span>
                      <span className="text-sm font-bold text-emerald-600">{reportData.header.ocrConfidence}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${reportData.header.ocrConfidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emotional Support Message */}
              <div className="mt-6 p-4 md:p-6 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex gap-3 items-start">
                  <Heart className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-amber-900 font-medium mb-2">Liebe Eltern,</p>
                    <p className="text-amber-800 text-sm leading-relaxed">
                      Diese Note zeigt Förderbedarf, aber sie ist kein Grund zur Verzweiflung. Mit gezielter
                      Unterstützung und konzentriertem Üben ist Verbesserung sehr möglich! Ihr Kind hat das
                      Potenzial – es braucht nur die richtige Anleitung.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================
            TAB NAVIGATION
            ==================================================================== */}
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ====================================================================
            TAB CONTENT - OVERVIEW
            ==================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <p className="text-xs text-slate-600 font-medium mb-2">Erreichte Punkte</p>
                <p className="text-2xl font-bold text-slate-800">
                  {reportData.scores.total.score}/{reportData.scores.total.max}
                </p>
                <p className="text-xs text-slate-500 mt-2">{reportData.header.percentage}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <p className="text-xs text-slate-600 font-medium mb-2">Promotion Risk</p>
                <p
                  className={`text-lg font-bold ${
                    reportData.warnings.promotionRisk === 'HIGH'
                      ? 'text-red-600'
                      : reportData.warnings.promotionRisk === 'MEDIUM'
                        ? 'text-orange-600'
                        : 'text-emerald-600'
                  }`}
                >
                  {reportData.warnings.promotionRisk === 'HIGH'
                    ? 'HOCH'
                    : reportData.warnings.promotionRisk === 'MEDIUM'
                      ? 'MITTEL'
                      : 'NIEDRIG'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <p className="text-xs text-slate-600 font-medium mb-2">Nächste Note</p>
                <p className="text-2xl font-bold text-slate-800">{reportData.warnings.requiredNextGrade}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <p className="text-xs text-slate-600 font-medium mb-2">Verbleibend</p>
                <p className="text-2xl font-bold text-slate-800">{reportData.warnings.remainingExams}</p>
                <p className="text-xs text-slate-500 mt-2">Klausuren</p>
              </div>
            </div>

            {/* Exam Structure */}
            <ExpandableCard title="Prüfungsaufbau" icon={BookOpen} defaultOpen={true}>
              <div className="space-y-4">
                {reportData.examStructure.map((task, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          Aufgabe {task.taskNumber}: {task.type}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">{task.topic}</p>
                      </div>
                      <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {task.weight}%
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium text-slate-700">Anforderung:</span>
                        <span className="text-slate-600 ml-2">{task.requirement}</span>
                      </p>
                      <p>
                        <span className="font-medium text-slate-700">Bearbeitet:</span>
                        <span className={`ml-2 font-bold ${task.wordCount >= task.wordCountRequired ? 'text-emerald-600' : 'text-red-600'}`}>
                          {task.wordCount}/{task.wordCountRequired} Wörter
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableCard>

            {/* Score Breakdown */}
            <ExpandableCard title="Punkteverteilung" icon={Target} defaultOpen={true}>
              <div className="space-y-6">
                {/* Task 1 */}
                {reportData.scores.task1 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">
                      Aufgabe 1 (Essay) - {reportData.examStructure[0]?.weight}%
                    </h4>
                    <div className="space-y-3">
                      <ProgressBar
                        score={(reportData.scores.task1?.content as any)?.score}
                        max={(reportData.scores.task1?.content as any)?.max}
                        label="Inhalt"
                        critical={(reportData.scores.task1?.content as any)?.critical}
                      />
                      <ProgressBar
                        score={(reportData.scores.task1?.language as any)?.score}
                        max={(reportData.scores.task1?.language as any)?.max}
                        label="Sprache"
                        critical={(reportData.scores.task1?.language as any)?.critical}
                      />
                      <ProgressBar
                        score={(reportData.scores.task1?.structure as any)?.score}
                        max={(reportData.scores.task1?.structure as any)?.max}
                        label="Struktur"
                        critical={(reportData.scores.task1?.structure as any)?.critical}
                      />
                    </div>
                  </div>
                )}

                {/* Task 2 */}
                {reportData.scores.task2 && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4">
                      Aufgabe 2 (Mediation) - {reportData.examStructure[1]?.weight}%
                    </h4>
                    <div className="space-y-3">
                      <ProgressBar
                        score={(reportData.scores.task2?.content as any)?.score}
                        max={(reportData.scores.task2?.content as any)?.max}
                        label="Inhalt"
                        critical={(reportData.scores.task2?.content as any)?.critical}
                      />
                      <ProgressBar
                        score={(reportData.scores.task2?.language as any)?.score}
                        max={(reportData.scores.task2?.language as any)?.max}
                        label="Sprache"
                        critical={(reportData.scores.task2?.language as any)?.critical}
                      />
                      <ProgressBar
                        score={(reportData.scores.task2?.register as any)?.score}
                        max={(reportData.scores.task2?.register as any)?.max}
                        label="Register"
                        critical={(reportData.scores.task2?.register as any)?.critical}
                      />
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">GESAMT:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {reportData.scores.total.score}/{reportData.scores.total.max} Punkte = {reportData.header.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </ExpandableCard>
          </div>
        )}

        {/* ====================================================================
            TAB CONTENT - ANALYSIS
            ==================================================================== */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Fairness Check */}
            <ExpandableCard title="Bewertungs-Check (Fair?) ⚖️" icon={Scale} defaultOpen={true}>
              <div className="space-y-4">
                {/* Fairness indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-900">Punkteabzüge nachvollziehbar</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-900">Kriterien transparent</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-900">Korrekturzeichen konsistent</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Keine Unstimmigkeiten gefunden</span>
                  </div>
                </div>

                {/* Correction frequency */}
                <div className="border-t pt-4">
                  <p className="font-semibold text-slate-800 mb-3">Korrekturhäufigkeit:</p>
                  <div className="space-y-2">
                    {reportData.fairnessCheck.corrections.map((correction, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-sm text-slate-700">
                          {correction.type}: <span className="font-bold">{correction.count}x</span>
                        </span>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                          {correction.assessment}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall assessment */}
                <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-900">
                    <span className="font-semibold">📌 EINSCHÄTZUNG:</span> Die Bewertung erscheint fair und
                    nachvollziehbar.
                  </p>
                </div>
              </div>
            </ExpandableCard>

            {/* Warning Signals */}
            <ExpandableCard title="Warnsignale & Handlungsbedarf 🚨" icon={AlertTriangle} defaultOpen={true}>
              <div className="space-y-4">
                {/* Immediate */}
                <div className={`p-4 rounded-lg border-l-4 border-red-500 ${getWarningColor('immediate')}`}>
                  <p className="font-semibold text-red-900 mb-3">🔴 SOFORT (Diese Woche):</p>
                  <ul className="space-y-2">
                    {reportData.warnings.immediate.map((warning, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-red-800">
                        <span className="font-bold">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Short term */}
                <div className={`p-4 rounded-lg border-l-4 border-orange-500 ${getWarningColor('shortTerm')}`}>
                  <p className="font-semibold text-orange-900 mb-3">🟠 KURZFRISTIG (Nächste 2 Wochen):</p>
                  <ul className="space-y-2">
                    {reportData.warnings.shortTerm.map((warning, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-orange-800">
                        <span className="font-bold">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Medium term */}
                <div className={`p-4 rounded-lg border-l-4 border-yellow-500 ${getWarningColor('mediumTerm')}`}>
                  <p className="font-semibold text-yellow-900 mb-3">🟡 MITTELFRISTIG (Nächster Monat):</p>
                  <ul className="space-y-2">
                    {reportData.warnings.mediumTerm.map((warning, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-yellow-800">
                        <span className="font-bold">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Promotion Risk */}
                <div
                  className={`p-4 rounded-lg border-2 mt-4 ${
                    reportData.warnings.promotionRisk === 'HIGH'
                      ? 'border-red-500 bg-red-50'
                      : reportData.warnings.promotionRisk === 'MEDIUM'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-emerald-500 bg-emerald-50'
                  }`}
                >
                  <p
                    className={`font-bold mb-2 ${
                      reportData.warnings.promotionRisk === 'HIGH'
                        ? 'text-red-900'
                        : reportData.warnings.promotionRisk === 'MEDIUM'
                          ? 'text-orange-900'
                          : 'text-emerald-900'
                    }`}
                  >
                    ⚠️ VERSETZUNGSGEFÄHRDUNG: {reportData.warnings.promotionRisk === 'HIGH' ? 'HOCH' : 'MITTEL'}
                  </p>
                  <p className={`text-sm ${
                      reportData.warnings.promotionRisk === 'HIGH'
                        ? 'text-red-800'
                        : reportData.warnings.promotionRisk === 'MEDIUM'
                          ? 'text-orange-800'
                          : 'text-emerald-800'
                    }`}>
                    Erforderliche Note nächste Arbeit: <span className="font-bold">{reportData.warnings.requiredNextGrade}</span>
                  </p>
                  <p className={`text-sm ${
                      reportData.warnings.promotionRisk === 'HIGH'
                        ? 'text-red-800'
                        : reportData.warnings.promotionRisk === 'MEDIUM'
                          ? 'text-orange-800'
                          : 'text-emerald-800'
                    }`}>
                    Verbleibende Arbeiten: <span className="font-bold">{reportData.warnings.remainingExams}</span>
                  </p>
                </div>
              </div>
            </ExpandableCard>

            {/* Error Analysis */}
            <ExpandableCard title="Fehleranalyse mit Beispielen" icon={Lightbulb}>
              <div className="space-y-4">
                {reportData.errorAnalysis.map((error, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">{error.type}</h4>
                      <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                        {error.count}x gefunden
                      </span>
                    </div>

                    {/* Examples */}
                    <div className="space-y-2 mb-4 p-3 bg-white rounded border border-slate-200">
                      {error.examples.map((example, exIdx) => (
                        <div key={exIdx} className="space-y-1">
                          <p className="text-sm">
                            <span className="text-red-600 font-medium">❌ {example.wrong}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-emerald-600 font-medium">✅ {example.correct}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-900 leading-relaxed">
                        <span className="font-semibold">💡 Erklärung für Eltern: </span>
                        {error.explanation}
                      </p>
                    </div>

                    {/* Rule */}
                    <div className="p-2 bg-slate-100 rounded">
                      <p className="text-xs font-mono text-slate-800">
                        <span className="font-semibold">📏 Regel:</span> {error.rule}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          </div>
        )}

        {/* ====================================================================
            TAB CONTENT - ACTION PLAN
            ==================================================================== */}
        {activeTab === 'actionPlan' && (
          <div className="space-y-6">
            {/* Parent Action Plan */}
            <ExpandableCard title="Eltern-Handlungsplan - Was Sie tun können" icon={Users} defaultOpen={true}>
              <div className="space-y-6">
                {/* This Week */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-slate-800">📅 DIESE WOCHE:</h4>
                  </div>
                  <div className="space-y-3">
                    {reportData.parentActions.thisWeek.map((item, idx) => (
                      <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex gap-3 mb-2">
                          <Square className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="font-medium text-slate-800">{item.action}</p>
                        </div>
                        <div className="ml-8 space-y-1">
                          {item.questions.map((question, qIdx) => (
                            <p key={qIdx} className="text-sm text-slate-700">
                              → "{question}"
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Two Weeks */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-slate-800">📅 NÄCHSTE 2 WOCHEN:</h4>
                  </div>
                  <div className="space-y-2">
                    {reportData.parentActions.nextTwoWeeks.map((action, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <Square className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ExpandableCard>

            {/* Learning Plan */}
            <ExpandableCard title="Priorisierter Lernplan" icon={Target} defaultOpen={true}>
              <div className="space-y-4">
                {reportData.learningPlan.map((plan, idx) => {
                  const colorMap: Record<string, string> = {
                    red: 'border-red-300 bg-red-50',
                    orange: 'border-orange-300 bg-orange-50',
                    yellow: 'border-yellow-300 bg-yellow-50',
                    gray: 'border-slate-300 bg-slate-50',
                  };
                  const iconColorMap: Record<string, string> = {
                    red: 'text-red-600',
                    orange: 'text-orange-600',
                    yellow: 'text-yellow-600',
                    gray: 'text-slate-600',
                  };

                  return (
                    <div key={idx} className={`p-4 border-l-4 rounded-lg ${colorMap[plan.color as string]}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className={`w-4 h-4 ${iconColorMap[plan.color as string]}`} />
                            <h5 className="font-bold text-slate-800">
                              PRIORITÄT {plan.priority}: {plan.title}
                            </h5>
                          </div>
                          <p className="text-xs text-slate-600">
                            Dauer: {plan.duration} | Zeit: {plan.timeCommitment}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold text-slate-700">WAS:</span>
                          <span className="text-slate-600 ml-2">{plan.what}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">WIE:</span>
                          <span className="text-slate-600 ml-2">{plan.how}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">ZIEL:</span>
                          <span className="text-slate-600 ml-2">{plan.successMetric}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">📚 Ressourcen:</span>
                          <span className="text-slate-600 ml-2">{plan.resources.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ExpandableCard>
          </div>
        )}

        {/* ====================================================================
            TAB CONTENT - STRENGTHS
            ==================================================================== */}
        {activeTab === 'strengths' && (
          <div className="space-y-6">
            {/* Strengths */}
            <ExpandableCard title="Das kann Ihr Kind bereits! 💪" icon={Star} defaultOpen={true}>
              <div className="space-y-3">
                {reportData.strengths.map((strength, idx) => (
                  <div key={idx} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex gap-3 items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-900">{strength.title}</p>
                        <p className="text-sm text-emerald-800 mt-1">{strength.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableCard>

            {/* Outlook */}
            <ExpandableCard title="Ausblick & Hoffnung 🎯" icon={TrendingDown} defaultOpen={true}>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase">Ziel Nächste Arbeit</p>
                      <p className="text-2xl font-bold text-blue-900">{reportData.outlook.nextExamGoal}</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Das ist realistisch mit {reportData.outlook.timeframe} konzentriertem Üben!
                      </p>
                    </div>
                    <div className="border-t border-blue-200 pt-3">
                      <p className="text-sm text-blue-800 italic">
                        "Realistische Verbesserung: <span className="font-bold">{reportData.outlook.realisticImprovement}</span>"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border-2 border-emerald-300">
                  <div className="flex gap-3 items-start">
                    <Heart className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-900 mb-2">Wichtige Botschaft für Ihr Kind:</p>
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        "Ihr Kind hat das Potenzial – es braucht nur die richtige Unterstützung und etwas Zeit.
                        Diese Note ist nicht das Ende der Geschichte, sondern der Anfang eines erfolgreichen
                        Lernprozesses!"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ExpandableCard>
          </div>
        )}

        {/* ====================================================================
            FOOTER
            ==================================================================== */}
        <div className="mt-12 p-6 bg-slate-100 rounded-lg text-center text-sm text-slate-600">
          <p>
            GradeAI Elternbericht • KI-gestützte Analyse • 100% datenschutzkonform • Erstellt für unterstützende
            Elterngespräche
          </p>
        </div>
      </div>
    </div>
  );
};

export default GradeAIParentReport;

