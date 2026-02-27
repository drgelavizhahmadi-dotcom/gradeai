'use client';

import { useState } from 'react';
import {
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Target, BookOpen, MessageCircle, Calendar, Lightbulb,
  Heart, Users, ExternalLink, Clock, TrendingUp, AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { translations, Language } from '@/lib/translations';

// Helper to get report translations with English fallback
function getReportTranslations(language: Language) {
  const t = translations[language];
  const en = translations.en;

  // Return translations with English fallback for missing keys
  return t.report || en.report;
}

interface ReportData {
  student?: { name?: string; class?: string };
  test?: { subject?: string; date?: string; topic?: string; type?: string; maxPoints?: string; achievedPoints?: string };
  _meta?: { language?: { code?: string; name?: string; native?: string; rtl?: boolean }; translatedFrom?: string };
  grade?: {
    value?: string;
    description?: string;
    percentage?: number | string;
    points?: string;
    isEstimated?: boolean;
    confidence?: string;
  };
  flashcards?: Array<{
    forWeakness?: string;
    front?: string;
    back?: string;
    tip?: string;
  }>;
  testContext?: {
    whatWasTested?: string;
    whyItMatters?: string;
    prerequisiteKnowledge?: string;
    nextTopics?: string;
  };
  teacherFeedback?: {
    mainComment?: string;
    whatTeacherMeans?: string;
    marginNotes?: string[];
    correctionMarks?: Record<string, string | number>;
    overallTone?: string;
  };
  errorAnalysis?: {
    summary?: string;
    errors?: Array<{
      type?: string;
      what?: string;
      whatHappened?: string;
      why?: string;
      whyItHappened?: string;
      fix?: string;
      correctApproach?: string;
      howToFix?: string;
      severity?: string;
      isPattern?: boolean;
    }>;
    conceptGaps?: Array<{
      concept?: string;
      signs?: string;
      foundationNeeded?: string;
    }>;
  };
  strengths?: Array<{ title?: string; description?: string; point?: string; evidence?: string; teacherNote?: string; howToLeverage?: string; page?: number } | string>;
  weaknesses?: Array<{ title?: string; description?: string; point?: string; evidence?: string; teacherNote?: string; rootCause?: string; example?: string; impact?: string; severity?: string; page?: number } | string>;
  actionPlan?: {
    immediate?: { title?: string; goal?: string; activities?: Array<{ day?: string; task?: string; duration?: string; howTo?: string; materials?: string }> };
    week2?: { title?: string; goal?: string; focus?: string; activities?: Array<{ task?: string; frequency?: string; duration?: string; howTo?: string }> };
    week3?: { title?: string; goal?: string; focus?: string; activities?: any[] };
    week4?: { title?: string; goal?: string; activities?: any[] };
    milestone?: string;
  };
  practiceExercises?: Array<{
    title?: string;
    targetSkill?: string;
    forWeakness?: string;
    difficulty?: string;
    instructions?: string;
    example?: string;
    examples?: string[];
    variations?: string[];
    timeNeeded?: string;
    frequency?: string;
  }>;
  exercises?: Array<{
    title?: string;
    forWeakness?: string;
    instructions?: string;
    examples?: string[];
    duration?: string;
    frequency?: string;
  }>;
  weeklyPlan?: {
    week1?: { goal?: string; monday?: string; tuesday?: string; wednesday?: string; thursday?: string; friday?: string };
    week2?: { goal?: string; focus?: string };
  };
  parentGuidance?: {
    howToDiscussGrade?: string;
    whatToAvoid?: string[];
    motivationTips?: string[];
    signsOfProgress?: string[];
    whenToSeekHelp?: string;
  };
  parentTips?: {
    howToDiscuss?: string;
    whatToAvoid?: string[];
    motivation?: string[];
  };
  teacherCommunication?: {
    shouldContactTeacher?: boolean;
    reason?: string;
    questionsToAsk?: string[];
    suggestedApproach?: string;
  };
  resources?: {
    websites?: Array<{ name?: string; url?: string; description?: string; bestFor?: string }>;
    apps?: string[];
    books?: string[];
    youtubeChannels?: string[];
  };
  fairnessCheck?: {
    isGradeFair?: string;
    verdict?: string;
    reasoning?: string;
    positiveAspects?: string[];
    whatWasFair?: string[];
    concerns?: string[];
    recommendation?: string;
    missingContext?: string;
    howToAddress?: string;
  };
  emotionalSupport?: {
    childMightFeel?: string;
    validationMessage?: string;
    encouragement?: string;
    parentReminder?: string;
  };
  messages?: {
    toParents?: string;
    toStudent?: string;
  };
  summary?: {
    oneSentence?: string;
    keyTakeaways?: string[];
    nextStep?: string;
  } | string;
  recommendations?: Array<{ action?: string; timeframe?: string; priority?: string } | string>;
}

interface ParentReportProps {
  data: ReportData;
  extractedText?: string | null | undefined;
  childName?: string | undefined;
  language?: Language | undefined;  // Override language for section titles
}

function Section({ title, icon: Icon, children, defaultOpen = true, color = 'primary' }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Using warm theme colors with CSS variables
  const colorClasses: Record<string, string> = {
    primary: 'border-[var(--primary)]/30 bg-[var(--primary-soft)]',
    success: 'border-[var(--success)]/30 bg-[var(--success)]/10',
    coral: 'border-[var(--coral)]/30 bg-[var(--coral)]/10',
    gold: 'border-[var(--gold)]/30 bg-[var(--gold)]/10',
    lavender: 'border-[var(--lavender)]/30 bg-[var(--lavender)]/10',
    pink: 'border-pink-200 bg-pink-50',
    gray: 'border-[var(--gray-200)] bg-[var(--gray-100)]',
    // Legacy color mappings
    blue: 'border-[var(--primary)]/30 bg-[var(--primary-soft)]',
    green: 'border-[var(--success)]/30 bg-[var(--success)]/10',
    red: 'border-[var(--coral)]/30 bg-[var(--coral)]/10',
    yellow: 'border-[var(--gold)]/30 bg-[var(--gold)]/10',
    purple: 'border-[var(--lavender)]/30 bg-[var(--lavender)]/10',
    orange: 'border-[var(--coral)]/30 bg-[var(--coral)]/10',
  };

  const iconColors: Record<string, string> = {
    primary: 'text-[var(--primary)]',
    success: 'text-[var(--success)]',
    coral: 'text-[var(--coral)]',
    gold: 'text-[var(--gold)]',
    lavender: 'text-[var(--lavender)]',
    pink: 'text-pink-600',
    gray: 'text-[var(--gray-600)]',
    // Legacy color mappings
    blue: 'text-[var(--primary)]',
    green: 'text-[var(--success)]',
    red: 'text-[var(--coral)]',
    yellow: 'text-[var(--gold)]',
    purple: 'text-[var(--lavender)]',
    orange: 'text-[var(--coral)]',
  };

  return (
    <div className={`rounded-2xl border-2 ${colorClasses[color] || colorClasses.primary} overflow-hidden shadow-sm`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${iconColors[color] || iconColors.primary}`} />
          <h2 className="font-semibold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-[var(--gray-500)]" /> : <ChevronDown className="w-5 h-5 text-[var(--gray-500)]" />}
      </button>
      {isOpen && <div className="px-5 pb-5 bg-white/80">{children}</div>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string | undefined }) {
  const colors: Record<string, string> = {
    kritisch: 'bg-red-100 text-red-800 border-red-200',
    hoch: 'bg-orange-100 text-orange-800 border-orange-200',
    mittel: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    leicht: 'bg-green-100 text-green-800 border-green-200',
  };

  if (!severity) return null;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[severity] || 'bg-gray-100 text-gray-800'}`}>
      {severity}
    </span>
  );
}

export function ParentReport({ data, extractedText, childName, language: propLanguage }: ParentReportProps) {
  const [showRaw, setShowRaw] = useState(false);
  const { language: contextLanguage } = useLanguage();
  // Use prop language if provided, otherwise fall back to context
  const language = propLanguage || contextLanguage;
  const t = getReportTranslations(language);
  const reportData = data || {};

  // Check if report has RTL language metadata
  const isRTL = data?._meta?.language?.rtl || ['ar', 'fa', 'ku'].includes(language);

  const studentName = reportData.student?.name || childName || 'Student';
  const grade = reportData.grade?.value || '—';
  const isGradeUnknown = !grade || grade === '—' || grade === 'nicht erkennbar' || grade.toLowerCase().includes('nicht') || grade.toLowerCase().includes('not');
  const gradeDesc = isGradeUnknown ? '' : (reportData.grade?.description || getGradeDescription(grade));
  const subject = reportData.test?.subject || 'Unknown';
  const percentage = typeof reportData.grade?.percentage === 'number'
    ? reportData.grade.percentage
    : (typeof reportData.grade?.percentage === 'string' && !reportData.grade.percentage.includes('nicht') ? parseInt(reportData.grade.percentage) : null);

  // Get summary text
  const summaryText = typeof reportData.summary === 'string'
    ? reportData.summary
    : reportData.summary?.oneSentence;

  return (
    <div className={`space-y-5 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Grade */}
      <div className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[var(--lavender)] text-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t.parentReport} - {subject}</h1>
            <p className="text-white/80 mt-1">
              {studentName} {reportData.student?.class && `• ${reportData.student.class}`}
            </p>
            {reportData.test?.topic && (
              <p className="text-white/60 text-sm mt-1">{reportData.test.topic}</p>
            )}
          </div>
          <div className={`text-center rounded-xl px-6 py-4 ${isGradeUnknown ? 'bg-[var(--gold)]/30' : 'bg-white/20'}`}>
            {isGradeUnknown ? (
              <>
                <div className="text-2xl font-bold">?</div>
                <div className="text-[var(--gold)]/80 text-sm">—</div>
              </>
            ) : (
              <>
                <div className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{grade}</div>
                <div className="text-white/80 text-sm font-medium">{gradeDesc}</div>
                {percentage && <div className="text-white/60 text-xs">{percentage}%</div>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Key Message to Parents */}
      {reportData.messages?.toParents && (
        <div className="bg-gradient-to-r from-[var(--lavender)]/20 to-pink-50 border-2 border-[var(--lavender)]/30 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Heart className="w-6 h-6 text-[var(--lavender)] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Liebe Eltern,</h3>
              <p className="text-[var(--gray-700)] leading-relaxed">{reportData.messages.toParents}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      {(summaryText || (typeof reportData.summary === 'object' && reportData.summary?.keyTakeaways)) && (
        <div className="bg-[var(--primary-soft)] border-2 border-[var(--primary)]/30 rounded-2xl p-5">
          <h3 className="font-semibold text-[var(--primary-dark)] mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Target className="w-5 h-5" />
            Das Wichtigste auf einen Blick
          </h3>
          {summaryText && <p className="text-[var(--gray-700)] mb-3 font-medium">{summaryText}</p>}
          {typeof reportData.summary === 'object' && reportData.summary?.keyTakeaways && (
            <ul className="space-y-2">
              {reportData.summary.keyTakeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-[var(--gray-700)]">
                  <CheckCircle className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-1" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          {typeof reportData.summary === 'object' && reportData.summary?.nextStep && (
            <div className="mt-4 p-3 bg-[var(--primary)]/20 rounded-xl">
              <p className="text-[var(--primary-dark)] font-medium">
                👉 Nächster Schritt: {reportData.summary.nextStep}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Test Context */}
      {reportData.testContext && (
        <Section title={t.whatWasTested || "Was wurde getestet?"} icon={BookOpen} color="blue">
          <div className="space-y-3">
            {reportData.testContext.whatWasTested && (
              <div>
                <p className="text-gray-700">{reportData.testContext.whatWasTested}</p>
              </div>
            )}
            {reportData.testContext.whyItMatters && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{t.whyImportant || "Warum ist das wichtig?"}</strong> {reportData.testContext.whyItMatters}
                </p>
              </div>
            )}
            {reportData.testContext.nextTopics && (
              <p className="text-sm text-gray-600">
                <strong>{t.nextTopics || "Als nächstes kommt:"}</strong> {reportData.testContext.nextTopics}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Teacher Feedback */}
      {reportData.teacherFeedback?.mainComment && (
        <Section title={t.teacherComment || "Lehrerkommentar"} icon={MessageCircle} color="yellow">
          <div className="space-y-3">
            <blockquote className="border-l-4 border-yellow-400 pl-4 py-2 italic text-gray-700 bg-yellow-50 rounded-r-lg">
              "{reportData.teacherFeedback.mainComment}"
            </blockquote>
            {reportData.teacherFeedback.whatTeacherMeans && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>{t.thatMeans || "Das bedeutet:"}</strong> {reportData.teacherFeedback.whatTeacherMeans}
                </p>
              </div>
            )}
            {reportData.teacherFeedback.correctionMarks && Object.keys(reportData.teacherFeedback.correctionMarks).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(reportData.teacherFeedback.correctionMarks).map(([mark, count]) => (
                  count && count !== '0' && count !== 0 && (
                    <span key={mark} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {mark}: {count}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Error Analysis */}
      {reportData.errorAnalysis && (reportData.errorAnalysis.errors?.length || reportData.errorAnalysis.conceptGaps?.length) && (
        <Section title={t.errorAnalysis || "Fehleranalyse"} icon={AlertTriangle} color="red" defaultOpen={true}>
          {reportData.errorAnalysis.summary && (
            <p className="text-gray-700 mb-4">{reportData.errorAnalysis.summary}</p>
          )}

          {reportData.errorAnalysis.errors && reportData.errorAnalysis.errors.length > 0 && (
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-gray-800">Konkrete Fehler:</h4>
              {reportData.errorAnalysis.errors.map((error, i) => (
                <div key={i} className="bg-white border border-red-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-medium text-red-800">{error.type || 'Fehler'}</span>
                    <SeverityBadge severity={error.severity} />
                  </div>
                  {(error.what || error.whatHappened) && (
                    <p className="text-gray-700 text-sm mb-2"><strong>Was:</strong> {error.what || error.whatHappened}</p>
                  )}
                  {(error.why || error.whyItHappened) && (
                    <p className="text-gray-700 text-sm mb-2 bg-red-50 p-2 rounded">
                      <strong>Warum:</strong> {error.why || error.whyItHappened}
                    </p>
                  )}
                  {(error.fix || error.howToFix) && (
                    <p className="text-green-700 text-sm"><strong>Lösung:</strong> {error.fix || error.howToFix}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {reportData.errorAnalysis.conceptGaps && reportData.errorAnalysis.conceptGaps.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Konzeptlücken:</h4>
              {reportData.errorAnalysis.conceptGaps.map((gap, i) => (
                <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="font-medium text-orange-800">{gap.concept}</p>
                  {gap.foundationNeeded && (
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Grundlage festigen:</strong> {gap.foundationNeeded}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strengths */}
        {reportData.strengths && reportData.strengths.length > 0 && (
          <Section title={t.strengths || "Stärken"} icon={CheckCircle} color="green">
            <ul className="space-y-3">
              {reportData.strengths.map((s, i) => {
                const strength = typeof s === 'string' ? { title: s } : s;
                // Handle multiple possible field names from different AI prompts
                const strengthText = strength.title || strength.description || strength.point || '';
                const evidenceText = strength.evidence || strength.teacherNote || '';
                return (
                  <li key={i} className="bg-white border border-green-100 rounded-lg p-3">
                    <p className="font-medium text-green-800">{strengthText}</p>
                    {evidenceText && (
                      <p className="text-sm text-gray-600 mt-1">Beleg: {evidenceText}</p>
                    )}
                    {strength.howToLeverage && (
                      <p className="text-sm text-green-700 mt-1 bg-green-50 p-2 rounded">
                        💡 {strength.howToLeverage}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {/* Weaknesses */}
        {reportData.weaknesses && reportData.weaknesses.length > 0 && (
          <Section title={t.areasForImprovement || "Verbesserungsfelder"} icon={AlertCircle} color="orange">
            <ul className="space-y-3">
              {reportData.weaknesses.map((w, i) => {
                const weakness = typeof w === 'string' ? { title: w } : w;
                // Handle multiple possible field names from different AI prompts
                const weaknessText = weakness.title || weakness.description || weakness.point || weakness.evidence || '';
                const causeText = weakness.rootCause || weakness.teacherNote || '';
                return (
                  <li key={i} className="bg-white border border-orange-100 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-orange-800">{weaknessText}</p>
                      <SeverityBadge severity={weakness.severity} />
                    </div>
                    {causeText && (
                      <p className="text-sm text-gray-600 mt-1">{t.cause || 'Ursache'}: {causeText}</p>
                    )}
                    {weakness.impact && (
                      <p className="text-sm text-orange-700 mt-1">⚠️ {weakness.impact}</p>
                    )}
                    {weakness.page && (
                      <p className="text-xs text-gray-400 mt-1">📄 {weakness.page}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
      </div>

      {/* Flashcards Section */}
      {reportData.flashcards && reportData.flashcards.length > 0 && (
        <Section title={`🎴 ${t.flashcards || "Lernkarten zum Ausdrucken"}`} icon={Lightbulb} color="orange" defaultOpen={true}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Drucken Sie diese Karten aus oder schreiben Sie sie auf Karteikarten. Vorderseite lesen,
              Antwort überlegen, dann umdrehen und überprüfen!
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {reportData.flashcards.map((card, i) => (
                <div key={i} className="border-2 border-orange-200 rounded-lg overflow-hidden">
                  {/* Card Front */}
                  <div className="bg-orange-50 p-4 border-b-2 border-orange-200">
                    <div className="text-xs text-orange-600 mb-1">Vorderseite:</div>
                    <p className="font-medium text-gray-800">{card.front}</p>
                  </div>
                  {/* Card Back */}
                  <div className="bg-white p-4">
                    <div className="text-xs text-green-600 mb-1">Rückseite:</div>
                    <p className="text-gray-700">{card.back}</p>
                    {card.tip && (
                      <p className="text-xs text-blue-600 mt-2 italic">💡 Merkhilfe: {card.tip}</p>
                    )}
                  </div>
                  {/* For Weakness */}
                  {card.forWeakness && (
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500">
                      Für: {card.forWeakness}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Tipp:</strong> Üben Sie die Karten täglich 10 Minuten. Sortieren Sie gemeisterte
                Karten aus und konzentrieren Sie sich auf die schwierigen!
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* Action Plan */}
      {reportData.actionPlan && (
        <Section title={t.actionPlan || "4-Wochen Aktionsplan"} icon={Calendar} color="purple" defaultOpen={true}>
          <div className="space-y-4">
            {/* Week 1 */}
            {reportData.actionPlan.immediate && (
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-purple-800">{reportData.actionPlan.immediate.title || 'Diese Woche'}</h4>
                {reportData.actionPlan.immediate.goal && (
                  <p className="text-sm text-gray-600 mb-2">Ziel: {reportData.actionPlan.immediate.goal}</p>
                )}
                {reportData.actionPlan.immediate.activities && reportData.actionPlan.immediate.activities.length > 0 && (
                  <div className="space-y-2">
                    {reportData.actionPlan.immediate.activities.map((activity, i) => (
                      <div key={i} className="bg-purple-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-purple-800">{activity.day}</span>
                          <span className="text-purple-600">• {activity.duration}</span>
                        </div>
                        <p className="text-gray-700">{activity.task}</p>
                        {activity.howTo && (
                          <p className="text-gray-600 mt-1 text-xs">📋 {activity.howTo}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Week 2 */}
            {reportData.actionPlan.week2 && reportData.actionPlan.week2.goal && (
              <div className="border-l-4 border-purple-400 pl-4">
                <h4 className="font-semibold text-purple-700">{reportData.actionPlan.week2.title || 'Woche 2'}</h4>
                <p className="text-sm text-gray-600">Ziel: {reportData.actionPlan.week2.goal}</p>
                {reportData.actionPlan.week2.focus && (
                  <p className="text-sm text-purple-600">Fokus: {reportData.actionPlan.week2.focus}</p>
                )}
              </div>
            )}

            {/* Week 3-4 Summary */}
            {(reportData.actionPlan.week3?.goal || reportData.actionPlan.week4?.goal) && (
              <div className="border-l-4 border-purple-300 pl-4">
                <h4 className="font-semibold text-purple-600">Woche 3-4: Festigung</h4>
                {reportData.actionPlan.week3?.goal && (
                  <p className="text-sm text-gray-600">Woche 3: {reportData.actionPlan.week3.goal}</p>
                )}
                {reportData.actionPlan.week4?.goal && (
                  <p className="text-sm text-gray-600">Woche 4: {reportData.actionPlan.week4.goal}</p>
                )}
              </div>
            )}

            {/* Milestone */}
            {reportData.actionPlan.milestone && (
              <div className="bg-purple-100 rounded-lg p-3 flex items-start gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">Fortschrittsindikator</p>
                  <p className="text-sm text-gray-700">{reportData.actionPlan.milestone}</p>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Practice Exercises */}
      {reportData.practiceExercises && reportData.practiceExercises.length > 0 && (
        <Section title={t.exercises || "Übungen für zu Hause"} icon={Lightbulb} color="yellow">
          <div className="space-y-4">
            {reportData.practiceExercises.map((exercise, i) => (
              <div key={i} className="bg-white border-2 border-yellow-200 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-yellow-50 p-4 border-b border-yellow-200">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-yellow-800">{exercise.title}</h4>
                    <div className="flex gap-2 text-xs flex-shrink-0">
                      {exercise.timeNeeded && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          ⏱️ {exercise.timeNeeded}
                        </span>
                      )}
                      {exercise.frequency && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          📅 {exercise.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                  {exercise.forWeakness && (
                    <p className="text-xs text-orange-600 mt-1">Für Schwäche: {exercise.forWeakness}</p>
                  )}
                  {exercise.targetSkill && (
                    <p className="text-sm text-gray-600 mt-1">Trainiert: {exercise.targetSkill}</p>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {exercise.instructions && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Anleitung:</p>
                      <p className="text-gray-700 text-sm">{exercise.instructions}</p>
                    </div>
                  )}

                  {/* Examples */}
                  {(exercise.examples?.length || exercise.example) && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-2">Beispiele:</p>
                      {exercise.examples ? (
                        <ul className="text-sm text-gray-700 space-y-1">
                          {exercise.examples.map((ex, j) => (
                            <li key={j}>• {ex}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-700">{exercise.example}</p>
                      )}
                    </div>
                  )}

                  {/* Variations */}
                  {exercise.variations && exercise.variations.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Variationen:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {exercise.variations.map((v, j) => (
                          <li key={j}>• {v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Parent Guidance */}
      {reportData.parentGuidance && (
        <Section title={t.parentTips || "Tipps für Eltern"} icon={Users} color="pink">
          <div className="space-y-4">
            {reportData.parentGuidance.howToDiscussGrade && (
              <div className="bg-white rounded-lg p-4 border border-pink-100">
                <h4 className="font-medium text-pink-800 mb-2">So besprechen Sie die Note:</h4>
                <p className="text-gray-700 text-sm">{reportData.parentGuidance.howToDiscussGrade}</p>
              </div>
            )}

            {reportData.parentGuidance.whatToAvoid && reportData.parentGuidance.whatToAvoid.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">⚠️ Das sollten Sie vermeiden:</h4>
                <ul className="space-y-1">
                  {reportData.parentGuidance.whatToAvoid.map((item, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <span>✕</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.parentGuidance.motivationTips && reportData.parentGuidance.motivationTips.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">💪 Motivation aufrechterhalten:</h4>
                <ul className="space-y-1">
                  {reportData.parentGuidance.motivationTips.map((tip, i) => (
                    <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                      <span>✓</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.parentGuidance.signsOfProgress && reportData.parentGuidance.signsOfProgress.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📈 Anzeichen für Fortschritt:</h4>
                <ul className="space-y-1">
                  {reportData.parentGuidance.signsOfProgress.map((sign, i) => (
                    <li key={i} className="text-sm text-gray-700">• {sign}</li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.parentGuidance.whenToSeekHelp && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Wann professionelle Hilfe?</strong> {reportData.parentGuidance.whenToSeekHelp}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Teacher Communication */}
      {reportData.teacherCommunication && reportData.teacherCommunication.shouldContactTeacher && (
        <Section title={t.talkToTeacher || "Gespräch mit der Lehrkraft"} icon={MessageCircle} color="blue">
          <div className="space-y-3">
            {reportData.teacherCommunication.reason && (
              <p className="text-gray-700">{reportData.teacherCommunication.reason}</p>
            )}
            {reportData.teacherCommunication.questionsToAsk && reportData.teacherCommunication.questionsToAsk.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Fragen für das Gespräch:</h4>
                <ul className="space-y-1">
                  {reportData.teacherCommunication.questionsToAsk.map((q, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600">?</span> {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reportData.teacherCommunication.suggestedApproach && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Einstieg:</strong> {reportData.teacherCommunication.suggestedApproach}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Fairness Check - ALWAYS VISIBLE */}
      {reportData.fairnessCheck && (
        <Section title={`⚖️ ${t.fairnessCheck || "War die Bewertung fair?"}`} icon={Target} color="purple" defaultOpen={true}>
          <div className="space-y-4">
            {/* Fairness Status Badge */}
            {(() => {
              const verdict = reportData.fairnessCheck?.verdict || reportData.fairnessCheck?.isGradeFair || '';
              const isFair = verdict === 'ja' || verdict === 'fair';
              const isProbablyFair = verdict === 'wahrscheinlich' || verdict === 'wahrscheinlich fair';
              const isQuestionable = verdict === 'fraglich';
              const isUnfair = verdict === 'nein' || verdict === 'unfair';

              return (
                <div className={`flex items-center gap-3 p-4 rounded-lg ${isFair ? 'bg-green-50 border-2 border-green-200' :
                  isProbablyFair ? 'bg-blue-50 border-2 border-blue-200' :
                    isQuestionable ? 'bg-yellow-50 border-2 border-yellow-200' :
                      isUnfair ? 'bg-red-50 border-2 border-red-200' :
                        'bg-gray-50 border-2 border-gray-200'
                  }`}>
                  <span className="text-3xl">
                    {isFair ? '✅' : isProbablyFair ? '👍' : isQuestionable ? '🤔' : isUnfair ? '⚠️' : '❓'}
                  </span>
                  <div>
                    <p className={`font-semibold ${isFair ? 'text-green-800' :
                      isProbablyFair ? 'text-blue-800' :
                        isQuestionable ? 'text-yellow-800' :
                          isUnfair ? 'text-red-800' : 'text-gray-800'
                      }`}>
                      {isFair ? 'Die Bewertung erscheint fair' :
                        isProbablyFair ? 'Wahrscheinlich fair bewertet' :
                          isQuestionable ? 'Einige Punkte sind fraglich' :
                            isUnfair ? 'Bewertung sollte überprüft werden' :
                              'Fairness nicht beurteilbar'}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Reasoning */}
            {reportData.fairnessCheck.reasoning && (
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-gray-700">{reportData.fairnessCheck.reasoning}</p>
              </div>
            )}

            {/* What was fair */}
            {(reportData.fairnessCheck.whatWasFair?.length || reportData.fairnessCheck.positiveAspects?.length) && (
              <div className="bg-green-50 rounded-lg p-3">
                <h4 className="font-medium text-green-800 mb-2">✓ Das war fair:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {(reportData.fairnessCheck.whatWasFair || reportData.fairnessCheck.positiveAspects || []).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {reportData.fairnessCheck.concerns && reportData.fairnessCheck.concerns.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Mögliche Bedenken:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {reportData.fairnessCheck.concerns.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Context */}
            {reportData.fairnessCheck.missingContext && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-700 mb-1">ℹ️ Was fehlt zur Beurteilung:</h4>
                <p className="text-sm text-gray-600">{reportData.fairnessCheck.missingContext}</p>
              </div>
            )}

            {/* Recommendation */}
            {reportData.fairnessCheck.recommendation && (
              <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                <h4 className="font-medium text-purple-800 mb-1">📋 Empfehlung:</h4>
                <p className="text-sm text-purple-700">{reportData.fairnessCheck.recommendation}</p>
              </div>
            )}

            {/* How to Address */}
            {reportData.fairnessCheck.howToAddress && (
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="font-medium text-blue-800 mb-1">💡 So können Sie das ansprechen:</h4>
                <p className="text-sm text-blue-700">{reportData.fairnessCheck.howToAddress}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Resources */}
      {reportData.resources && (reportData.resources.websites?.length || reportData.resources.apps?.length || reportData.resources.books?.length) && (
        <Section title={t.resources || "Hilfreiche Ressourcen"} icon={ExternalLink} color="blue" defaultOpen={false}>
          <div className="space-y-4">
            {reportData.resources.websites && reportData.resources.websites.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">🌐 Websites:</h4>
                <div className="space-y-2">
                  {reportData.resources.websites.map((site, i) => (
                    <div key={i} className="bg-white rounded border p-2">
                      <p className="font-medium text-blue-700">{site.name}</p>
                      {site.description && <p className="text-sm text-gray-600">{site.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportData.resources.apps && reportData.resources.apps.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📱 Apps:</h4>
                <div className="flex flex-wrap gap-2">
                  {reportData.resources.apps.map((app, i) => (
                    <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{app}</span>
                  ))}
                </div>
              </div>
            )}

            {reportData.resources.books && reportData.resources.books.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📚 Bücher/Übungshefte:</h4>
                <ul className="space-y-1">
                  {reportData.resources.books.map((book, i) => (
                    <li key={i} className="text-sm text-gray-700">• {book}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Emotional Support */}
      {reportData.emotionalSupport && (
        <Section title={t.emotionalSupport || "Emotionale Unterstützung"} icon={Heart} color="pink" defaultOpen={false}>
          <div className="space-y-3">
            {reportData.emotionalSupport.childMightFeel && (
              <p className="text-gray-700">
                <strong>Ihr Kind fühlt sich vielleicht:</strong> {reportData.emotionalSupport.childMightFeel}
              </p>
            )}
            {reportData.emotionalSupport.validationMessage && (
              <div className="bg-pink-50 rounded-lg p-3">
                <p className="text-pink-800">{reportData.emotionalSupport.validationMessage}</p>
              </div>
            )}
            {reportData.emotionalSupport.parentReminder && (
              <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                <p className="text-purple-800 text-sm italic">💜 {reportData.emotionalSupport.parentReminder}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Message to Student */}
      {reportData.messages?.toStudent && (
        <div className="bg-gradient-to-r from-[var(--success)]/20 to-[var(--primary-soft)] border-2 border-[var(--success)]/30 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌟</span>
            <div>
              <h3 className="font-semibold text-[var(--success-dark)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Nachricht an {studentName}:</h3>
              <p className="text-[var(--gray-700)] leading-relaxed italic">"{reportData.messages.toStudent}"</p>
            </div>
          </div>
        </div>
      )}

      {/* New Weekly Plan (from simplified prompt) */}
      {reportData.weeklyPlan && (reportData.weeklyPlan.week1 || reportData.weeklyPlan.week2) && (
        <Section title={`📅 ${t.weeklyPlan || "Wochenplan"}`} icon={Calendar} color="purple" defaultOpen={true}>
          <div className="space-y-4">
            {/* Week 1 - Detailed daily plan */}
            {reportData.weeklyPlan.week1 && (
              <div className="border-2 border-purple-200 rounded-lg overflow-hidden">
                <div className="bg-purple-100 p-3">
                  <h4 className="font-semibold text-purple-800">Woche 1</h4>
                  {reportData.weeklyPlan.week1.goal && (
                    <p className="text-sm text-purple-600">🎯 Ziel: {reportData.weeklyPlan.week1.goal}</p>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {reportData.weeklyPlan.week1.monday && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-purple-700 w-20 flex-shrink-0">Montag:</span>
                      <span className="text-gray-700">{reportData.weeklyPlan.week1.monday}</span>
                    </div>
                  )}
                  {reportData.weeklyPlan.week1.tuesday && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-purple-700 w-20 flex-shrink-0">Dienstag:</span>
                      <span className="text-gray-700">{reportData.weeklyPlan.week1.tuesday}</span>
                    </div>
                  )}
                  {reportData.weeklyPlan.week1.wednesday && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-purple-700 w-20 flex-shrink-0">Mittwoch:</span>
                      <span className="text-gray-700">{reportData.weeklyPlan.week1.wednesday}</span>
                    </div>
                  )}
                  {reportData.weeklyPlan.week1.thursday && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-purple-700 w-20 flex-shrink-0">Donnerstag:</span>
                      <span className="text-gray-700">{reportData.weeklyPlan.week1.thursday}</span>
                    </div>
                  )}
                  {reportData.weeklyPlan.week1.friday && (
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-purple-700 w-20 flex-shrink-0">Freitag:</span>
                      <span className="text-gray-700">{reportData.weeklyPlan.week1.friday}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Week 2 - Focus overview */}
            {reportData.weeklyPlan.week2 && (
              <div className="border-2 border-purple-100 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-700">Woche 2</h4>
                {reportData.weeklyPlan.week2.goal && (
                  <p className="text-sm text-purple-600 mt-1">🎯 Ziel: {reportData.weeklyPlan.week2.goal}</p>
                )}
                {reportData.weeklyPlan.week2.focus && (
                  <p className="text-sm text-gray-600 mt-1">📌 Fokus: {reportData.weeklyPlan.week2.focus}</p>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* New Exercises (from simplified prompt) */}
      {reportData.exercises && reportData.exercises.length > 0 && (
        <Section title={`📝 ${t.exercises || "Gezielte Übungen"}`} icon={Lightbulb} color="yellow" defaultOpen={true}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">
              Diese Übungen sind speziell auf die identifizierten Schwächen abgestimmt:
            </p>
            {reportData.exercises.map((exercise, i) => (
              <div key={i} className="bg-white border-2 border-yellow-200 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-yellow-50 p-4 border-b border-yellow-200">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-yellow-800">{exercise.title}</h4>
                    <div className="flex gap-2 text-xs flex-shrink-0">
                      {exercise.duration && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          ⏱️ {exercise.duration}
                        </span>
                      )}
                      {exercise.frequency && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          📅 {exercise.frequency}
                        </span>
                      )}
                    </div>
                  </div>
                  {exercise.forWeakness && (
                    <p className="text-xs text-orange-600 mt-1">🎯 Für Schwäche: {exercise.forWeakness}</p>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {exercise.instructions && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">So geht's:</p>
                      <p className="text-gray-700 text-sm">{exercise.instructions}</p>
                    </div>
                  )}

                  {/* Examples */}
                  {exercise.examples && exercise.examples.length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-2">Beispielaufgaben:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {exercise.examples.map((ex, j) => (
                          <li key={j}>• {ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* New Parent Tips (from simplified prompt) */}
      {reportData.parentTips && (reportData.parentTips.howToDiscuss || reportData.parentTips.whatToAvoid?.length || reportData.parentTips.motivation?.length) && (
        <Section title={`💡 ${t.parentTips || "Tipps für Eltern"}`} icon={Users} color="pink" defaultOpen={true}>
          <div className="space-y-4">
            {reportData.parentTips.howToDiscuss && (
              <div className="bg-white rounded-lg p-4 border border-pink-100">
                <h4 className="font-medium text-pink-800 mb-2">🗣️ So besprechen Sie die Note:</h4>
                <p className="text-gray-700 text-sm">{reportData.parentTips.howToDiscuss}</p>
              </div>
            )}

            {reportData.parentTips.whatToAvoid && reportData.parentTips.whatToAvoid.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">⚠️ Das sollten Sie vermeiden:</h4>
                <ul className="space-y-1">
                  {reportData.parentTips.whatToAvoid.map((item, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <span>✕</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.parentTips.motivation && reportData.parentTips.motivation.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">💪 So motivieren Sie Ihr Kind:</h4>
                <ul className="space-y-1">
                  {reportData.parentTips.motivation.map((tip, i) => (
                    <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                      <span>✓</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Legacy recommendations fallback */}
      {!reportData.actionPlan && reportData.recommendations && reportData.recommendations.length > 0 && (
        <Section title={t.recommendation || "Empfehlungen"} icon={Lightbulb} color="blue">
          <ul className="space-y-2">
            {reportData.recommendations.map((r, i) => (
              <li key={i} className="bg-white p-3 rounded-lg border">
                <p className="text-gray-700">
                  {typeof r === 'string' ? r : r.action}
                </p>
                {typeof r !== 'string' && r.timeframe && (
                  <span className="text-xs text-gray-500 mt-1 inline-block">⏱️ {r.timeframe}</span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Raw Data Toggle */}
      {extractedText && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showRaw ? (t.hideRawData || 'Rohdaten ausblenden') : (t.showRawData || 'Rohdaten anzeigen')}
          </button>
          {showRaw && (
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              {extractedText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    '1': 'sehr gut', '1+': 'sehr gut', '1-': 'sehr gut',
    '2': 'gut', '2+': 'gut', '2-': 'gut',
    '3': 'befriedigend', '3+': 'befriedigend', '3-': 'befriedigend',
    '4': 'ausreichend', '4+': 'ausreichend', '4-': 'ausreichend',
    '5': 'mangelhaft', '5+': 'mangelhaft', '5-': 'mangelhaft',
    '6': 'ungenügend',
  };
  return descriptions[grade] || '';
}
