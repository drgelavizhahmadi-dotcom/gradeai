import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Target,
  Lightbulb,
  Euro,
  Award,
  ArrowRight,
  Info,
  ExternalLink,
} from 'lucide-react'
import { TestAnalysis } from '@/lib/ai/prompts'

interface AnalysisDisplayProps {
  analysis: TestAnalysis
}

export default function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  // Determine severity colors with enhanced contrast
  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'excellent':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          text: 'text-emerald-900',
          textLight: 'text-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
          icon: 'text-emerald-600',
          gradient: 'from-emerald-500 to-green-600',
        }
      case 'good':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-300',
          text: 'text-sky-900',
          textLight: 'text-sky-700',
          badge: 'bg-sky-100 text-sky-800 border border-sky-300',
          icon: 'text-sky-600',
          gradient: 'from-sky-500 to-blue-600',
        }
      case 'satisfactory':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          text: 'text-amber-900',
          textLight: 'text-amber-700',
          badge: 'bg-amber-100 text-amber-800 border border-amber-300',
          icon: 'text-amber-600',
          gradient: 'from-amber-500 to-yellow-600',
        }
      case 'concerning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-900',
          textLight: 'text-orange-700',
          badge: 'bg-orange-100 text-orange-800 border border-orange-300',
          icon: 'text-orange-600',
          gradient: 'from-orange-500 to-red-600',
        }
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          textLight: 'text-red-700',
          badge: 'bg-red-100 text-red-800 border border-red-300',
          icon: 'text-red-600',
          gradient: 'from-red-500 to-rose-600',
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-900',
          textLight: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800 border border-gray-300',
          icon: 'text-gray-600',
          gradient: 'from-gray-500 to-slate-600',
        }
    }
  }

  const severityColors = getSeverityColors(analysis.gradeInterpretation.severity)

  return (
    <div className="space-y-8">
      {/* 1. Grade Interpretation Card - Enhanced with larger text and better spacing */}
      <div
        className={`rounded-2xl border-2 ${severityColors.border} ${severityColors.bg} p-6 sm:p-8 shadow-lg`}
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <AlertCircle className={`h-10 w-10 ${severityColors.icon} flex-shrink-0`} />
            <div>
              <h2 className={`text-2xl sm:text-3xl font-bold ${severityColors.text} mb-2`}>
                Grade Interpretation
              </h2>
              <span
                className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${severityColors.badge}`}
              >
                {analysis.gradeInterpretation.severity.charAt(0).toUpperCase() +
                  analysis.gradeInterpretation.severity.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-white/60 p-4 backdrop-blur-sm min-w-[100px]">
            <div className={`text-xs font-bold uppercase tracking-wider ${severityColors.textLight} mb-1`}>
              Concern Level
            </div>
            <div className={`text-4xl font-extrabold ${severityColors.text}`}>
              {analysis.gradeInterpretation.concernLevel}
              <span className="text-2xl">/10</span>
            </div>
          </div>
        </div>
        <p className={`text-base sm:text-lg leading-relaxed ${severityColors.text} font-medium`}>
          {analysis.gradeInterpretation.meaning}
        </p>
      </div>

      {/* 2. Teacher Feedback Section - Improved typography */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-lg border border-gray-200">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-3">
            <MessageSquare className="h-6 w-6 text-purple-700" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Feedback</h2>
        </div>
        <div className="mb-6 rounded-xl bg-purple-50 border border-purple-200 p-5">
          <p className="text-base sm:text-lg leading-relaxed text-gray-800">
            {analysis.teacherFeedback.decoded}
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
            Key Takeaways
          </h3>
          <ol className="space-y-3">
            {analysis.teacherFeedback.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-bold text-white shadow-md">
                  {index + 1}
                </span>
                <span className="flex-1 text-gray-700 leading-relaxed pt-0.5">{point}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 3. Strengths & Weaknesses Grid - Enhanced mobile stacking */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strengths */}
        <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 p-6 sm:p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-emerald-900">Strengths</h2>
          </div>
          <ul className="space-y-4">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="flex-1 text-gray-800 leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="rounded-2xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 p-6 sm:p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3">
              <Target className="h-6 w-6 text-orange-700" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-orange-900">Areas to Improve</h2>
          </div>
          <ul className="space-y-4">
            {analysis.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <ArrowRight className="h-5 w-5 flex-shrink-0 text-orange-600 mt-0.5 group-hover:translate-x-1 transition-transform" />
                <span className="flex-1 text-gray-800 leading-relaxed">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. Action Plan Section - Enhanced cards with better hierarchy */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 sm:p-8 shadow-lg border border-blue-200">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3">
            <Lightbulb className="h-6 w-6 text-blue-700" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Action Plan</h2>
        </div>
        <div className="space-y-5">
          {[
            { data: analysis.actionPlan.priority1, color: 'blue', num: 1 },
            { data: analysis.actionPlan.priority2, color: 'indigo', num: 2 },
            { data: analysis.actionPlan.priority3, color: 'purple', num: 3 },
          ].map(({ data, color, num }) => (
            <div key={num} className="rounded-xl bg-white p-5 sm:p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 text-base font-bold text-white shadow-md`}>
                  {num}
                </span>
                <span className={`rounded-full bg-${color}-100 border border-${color}-200 px-4 py-1.5 text-xs font-bold text-${color}-800 uppercase tracking-wide`}>
                  {data.timeframe}
                </span>
              </div>
              <h3 className="mb-3 text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                {data.action}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {data.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Resources Section - Improved card design */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-lg border border-gray-200">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3">
            <TrendingUp className="h-6 w-6 text-blue-700" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Recommended Resources</h2>
        </div>

        {/* Free Resources */}
        <div className="mb-8">
          <h3 className="mb-5 flex items-center gap-2 text-lg sm:text-xl font-bold text-emerald-800">
            <CheckCircle2 className="h-6 w-6" />
            Free Resources
          </h3>
          <div className="space-y-4">
            {analysis.resources.free.map((resource, index) => (
              <div
                key={index}
                className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-5 hover:shadow-md transition-shadow"
              >
                <h4 className="mb-2 text-lg font-bold text-gray-900">{resource.name}</h4>
                <p className="mb-3 text-sm sm:text-base text-gray-700 leading-relaxed">{resource.description}</p>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Visit Website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Paid Resources */}
        {analysis.resources.paid.length > 0 && (
          <div>
            <h3 className="mb-5 flex items-center gap-2 text-lg sm:text-xl font-bold text-blue-800">
              <Euro className="h-6 w-6" />
              Paid Options
            </h3>
            <div className="space-y-4">
              {analysis.resources.paid.map((resource, index) => (
                <div
                  key={index}
                  className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <h4 className="text-lg font-bold text-gray-900 flex-1">{resource.name}</h4>
                    <span className="rounded-full bg-blue-100 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-800 whitespace-nowrap">
                      {resource.estimatedCost}
                    </span>
                  </div>
                  <p className="mb-3 text-sm sm:text-base text-gray-700 leading-relaxed">{resource.description}</p>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      Visit Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Prediction Card - Enhanced with better mobile layout */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
            <Award className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">End of Semester Prediction</h2>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg">
            {analysis.prediction.endOfSemester}
          </div>
          <div>
            <span
              className={`inline-block rounded-full px-4 py-2 text-sm font-bold shadow-lg ${
                analysis.prediction.confidence === 'high'
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                  : analysis.prediction.confidence === 'medium'
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                  : 'bg-orange-100 text-orange-800 border-2 border-orange-300'
              }`}
            >
              {analysis.prediction.confidence.charAt(0).toUpperCase() +
                analysis.prediction.confidence.slice(1)}{' '}
              Confidence
            </span>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-white/15 p-5 backdrop-blur-md border border-white/20">
          <Info className="h-5 w-5 flex-shrink-0 text-white mt-0.5" />
          <p className="text-white text-base leading-relaxed">{analysis.prediction.reasoning}</p>
        </div>
      </div>
    </div>
  )
}
