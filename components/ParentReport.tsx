'use client';

import { useState } from 'react';
import {
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Target, BookOpen, MessageCircle, Calendar, Lightbulb,
  Heart, Users, ExternalLink, Clock, TrendingUp, AlertCircle
} from 'lucide-react';

interface ReportData {
  student?: { name?: string; class?: string };
  test?: { subject?: string; date?: string; topic?: string; type?: string; maxPoints?: string; achievedPoints?: string };
  grade?: {
    value?: string;
    description?: string;
    percentage?: number | string;
    points?: string;
  };
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
      whatHappened?: string;
      whyItHappened?: string;
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
  strengths?: Array<{ title?: string; description?: string; evidence?: string; howToLeverage?: string } | string>;
  weaknesses?: Array<{ title?: string; description?: string; rootCause?: string; example?: string; impact?: string; severity?: string } | string>;
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
    difficulty?: string;
    instructions?: string;
    example?: string;
    variations?: string[];
    timeNeeded?: string;
    frequency?: string;
  }>;
  parentGuidance?: {
    howToDiscussGrade?: string;
    whatToAvoid?: string[];
    motivationTips?: string[];
    signsOfProgress?: string[];
    whenToSeekHelp?: string;
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
    reasoning?: string;
    positiveAspects?: string[];
    concerns?: string[];
    recommendation?: string;
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
  extractedText?: string | null;
  childName?: string;
}

function Section({ title, icon: Icon, children, defaultOpen = true, color = 'blue' }: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorClasses: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50',
    pink: 'border-pink-200 bg-pink-50',
    gray: 'border-gray-200 bg-gray-50',
  };

  const iconColors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600',
  };

  return (
    <div className={`rounded-lg border-2 ${colorClasses[color]} overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColors[color]}`} />
          <h2 className="font-semibold text-gray-800">{title}</h2>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>
      {isOpen && <div className="px-4 pb-4 bg-white/80">{children}</div>}
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

export function ParentReport({ data, extractedText, childName }: ParentReportProps) {
  const [showRaw, setShowRaw] = useState(false);
  const reportData = data || {};

  const studentName = reportData.student?.name || childName || 'Schüler/in';
  const grade = reportData.grade?.value || '—';
  const gradeDesc = reportData.grade?.description || getGradeDescription(grade);
  const subject = reportData.test?.subject || 'Unbekannt';
  const percentage = typeof reportData.grade?.percentage === 'number'
    ? reportData.grade.percentage
    : (typeof reportData.grade?.percentage === 'string' ? parseInt(reportData.grade.percentage) : null);

  // Get summary text
  const summaryText = typeof reportData.summary === 'string'
    ? reportData.summary
    : reportData.summary?.oneSentence;

  return (
    <div className="space-y-4">
      {/* Header with Grade */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Elternbericht - {subject}</h1>
            <p className="text-blue-100 mt-1">
              {studentName} {reportData.student?.class && `• ${reportData.student.class}`}
            </p>
            {reportData.test?.topic && (
              <p className="text-blue-200 text-sm mt-1">Thema: {reportData.test.topic}</p>
            )}
          </div>
          <div className="text-center bg-white/20 rounded-lg px-6 py-3">
            <div className="text-4xl font-bold">{grade}</div>
            <div className="text-blue-100 text-sm">{gradeDesc}</div>
            {percentage && <div className="text-blue-200 text-xs">{percentage}%</div>}
          </div>
        </div>
      </div>

      {/* Key Message to Parents */}
      {reportData.messages?.toParents && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Heart className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">Liebe Eltern,</h3>
              <p className="text-gray-700 leading-relaxed">{reportData.messages.toParents}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      {(summaryText || (typeof reportData.summary === 'object' && reportData.summary?.keyTakeaways)) && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Das Wichtigste auf einen Blick
          </h3>
          {summaryText && <p className="text-gray-700 mb-3 font-medium">{summaryText}</p>}
          {typeof reportData.summary === 'object' && reportData.summary?.keyTakeaways && (
            <ul className="space-y-1">
              {reportData.summary.keyTakeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          {typeof reportData.summary === 'object' && reportData.summary?.nextStep && (
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <p className="text-blue-900 font-medium">
                👉 Nächster Schritt: {reportData.summary.nextStep}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Test Context */}
      {reportData.testContext && (
        <Section title="Was wurde getestet?" icon={BookOpen} color="blue">
          <div className="space-y-3">
            {reportData.testContext.whatWasTested && (
              <div>
                <p className="text-gray-700">{reportData.testContext.whatWasTested}</p>
              </div>
            )}
            {reportData.testContext.whyItMatters && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Warum ist das wichtig?</strong> {reportData.testContext.whyItMatters}
                </p>
              </div>
            )}
            {reportData.testContext.nextTopics && (
              <p className="text-sm text-gray-600">
                <strong>Als nächstes kommt:</strong> {reportData.testContext.nextTopics}
              </p>
            )}
          </div>
        </Section>
      )}

      {/* Teacher Feedback */}
      {reportData.teacherFeedback?.mainComment && (
        <Section title="Lehrerkommentar" icon={MessageCircle} color="yellow">
          <div className="space-y-3">
            <blockquote className="border-l-4 border-yellow-400 pl-4 py-2 italic text-gray-700 bg-yellow-50 rounded-r-lg">
              "{reportData.teacherFeedback.mainComment}"
            </blockquote>
            {reportData.teacherFeedback.whatTeacherMeans && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Das bedeutet:</strong> {reportData.teacherFeedback.whatTeacherMeans}
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
        <Section title="Fehleranalyse" icon={AlertTriangle} color="red" defaultOpen={true}>
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
                  {error.whatHappened && (
                    <p className="text-gray-700 text-sm mb-2"><strong>Was:</strong> {error.whatHappened}</p>
                  )}
                  {error.whyItHappened && (
                    <p className="text-gray-700 text-sm mb-2 bg-red-50 p-2 rounded">
                      <strong>Warum:</strong> {error.whyItHappened}
                    </p>
                  )}
                  {error.howToFix && (
                    <p className="text-green-700 text-sm"><strong>Lösung:</strong> {error.howToFix}</p>
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
          <Section title="Stärken" icon={CheckCircle} color="green">
            <ul className="space-y-3">
              {reportData.strengths.map((s, i) => {
                const strength = typeof s === 'string' ? { title: s } : s;
                return (
                  <li key={i} className="bg-white border border-green-100 rounded-lg p-3">
                    <p className="font-medium text-green-800">{strength.title || strength.description}</p>
                    {strength.evidence && (
                      <p className="text-sm text-gray-600 mt-1">Beleg: {strength.evidence}</p>
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
          <Section title="Verbesserungsfelder" icon={AlertCircle} color="orange">
            <ul className="space-y-3">
              {reportData.weaknesses.map((w, i) => {
                const weakness = typeof w === 'string' ? { title: w } : w;
                return (
                  <li key={i} className="bg-white border border-orange-100 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-orange-800">{weakness.title || weakness.description}</p>
                      <SeverityBadge severity={weakness.severity} />
                    </div>
                    {weakness.rootCause && (
                      <p className="text-sm text-gray-600 mt-1">Ursache: {weakness.rootCause}</p>
                    )}
                    {weakness.impact && (
                      <p className="text-sm text-orange-700 mt-1">⚠️ {weakness.impact}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
      </div>

      {/* Action Plan */}
      {reportData.actionPlan && (
        <Section title="4-Wochen Aktionsplan" icon={Calendar} color="purple" defaultOpen={true}>
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
        <Section title="Übungen für zu Hause" icon={Lightbulb} color="yellow">
          <div className="space-y-3">
            {reportData.practiceExercises.map((exercise, i) => (
              <div key={i} className="bg-white border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-yellow-800">{exercise.title}</h4>
                  <div className="flex gap-2 text-xs">
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
                {exercise.targetSkill && (
                  <p className="text-sm text-gray-600 mb-2">Trainiert: {exercise.targetSkill}</p>
                )}
                {exercise.instructions && (
                  <p className="text-gray-700 text-sm">{exercise.instructions}</p>
                )}
                {exercise.example && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                    <strong>Beispiel:</strong> {exercise.example}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Parent Guidance */}
      {reportData.parentGuidance && (
        <Section title="Tipps für Eltern" icon={Users} color="pink">
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
        <Section title="Gespräch mit der Lehrkraft" icon={MessageCircle} color="blue">
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

      {/* Fairness Check */}
      {reportData.fairnessCheck && reportData.fairnessCheck.isGradeFair && (
        <Section title="Bewertung der Note" icon={Target} color="gray" defaultOpen={false}>
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              reportData.fairnessCheck.isGradeFair === 'ja' ? 'bg-green-100 text-green-800' :
              reportData.fairnessCheck.isGradeFair === 'wahrscheinlich' ? 'bg-blue-100 text-blue-800' :
              reportData.fairnessCheck.isGradeFair === 'fraglich' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {reportData.fairnessCheck.isGradeFair === 'ja' ? '✓ Note erscheint fair' :
               reportData.fairnessCheck.isGradeFair === 'wahrscheinlich' ? '~ Wahrscheinlich fair' :
               reportData.fairnessCheck.isGradeFair === 'fraglich' ? '? Einige Fragen' :
               '⚠ Überprüfung empfohlen'}
            </div>

            {reportData.fairnessCheck.reasoning && (
              <p className="text-gray-700 text-sm">{reportData.fairnessCheck.reasoning}</p>
            )}

            {reportData.fairnessCheck.concerns && reportData.fairnessCheck.concerns.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <h4 className="font-medium text-yellow-800 mb-1">Mögliche Bedenken:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {reportData.fairnessCheck.concerns.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.fairnessCheck.recommendation && (
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>Empfehlung:</strong> {reportData.fairnessCheck.recommendation}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Resources */}
      {reportData.resources && (reportData.resources.websites?.length || reportData.resources.apps?.length || reportData.resources.books?.length) && (
        <Section title="Hilfreiche Ressourcen" icon={ExternalLink} color="blue" defaultOpen={false}>
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
        <Section title="Emotionale Unterstützung" icon={Heart} color="pink" defaultOpen={false}>
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
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🌟</span>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Nachricht an {studentName}:</h3>
              <p className="text-gray-700 leading-relaxed italic">"{reportData.messages.toStudent}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Legacy recommendations fallback */}
      {!reportData.actionPlan && reportData.recommendations && reportData.recommendations.length > 0 && (
        <Section title="Empfehlungen" icon={Lightbulb} color="blue">
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
            {showRaw ? 'Rohdaten ausblenden' : 'Rohdaten anzeigen'}
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
