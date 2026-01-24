'use client'

import React, { useState } from 'react'
import { 
  Scale, AlertTriangle, CheckCircle, HelpCircle, 
  MessageCircle, ChevronDown, ChevronUp,
  FileQuestion, ThumbsUp, AlertCircle,
  BookOpen, Users, Gavel, XCircle
} from 'lucide-react'
import { useLanguage } from '../LanguageContext'
import { FairnessResult } from '../hooks/useFairnessCheck'

interface FairnessCheckSectionProps {
  analysisData: any
  onRequestFairnessCheck: () => void
  fairnessResult: FairnessResult | null
  isLoading: boolean
}

const FairnessCheckSection: React.FC<FairnessCheckSectionProps> = ({ 
  analysisData, 
  onRequestFairnessCheck,
  fairnessResult,
  isLoading 
}) => {
  const { isRTL } = useLanguage()
  const [showDetails, setShowDetails] = useState(false)

  // Verdict colors and icons
  const verdictConfig = {
    FAIR: {
      color: 'emerald',
      icon: CheckCircle,
      bgGradient: 'from-emerald-50 to-green-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-800'
    },
    MOSTLY_FAIR: {
      color: 'blue',
      icon: ThumbsUp,
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800'
    },
    QUESTIONABLE: {
      color: 'amber',
      icon: HelpCircle,
      bgGradient: 'from-amber-50 to-yellow-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-800'
    },
    RECOMMEND_REVIEW: {
      color: 'red',
      icon: AlertTriangle,
      bgGradient: 'from-red-50 to-orange-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    }
  }

  // If no fairness check done yet, show the request button
  if (!fairnessResult && !isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <Scale className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                Is This Grade Fair?
              </h3>
              <p className="text-sm text-slate-500">
                Get an independent AI assessment of the grading
              </p>
            </div>
          </div>

          <p className="text-slate-600 mb-6">
            Our AI will analyze the test corrections in detail to check for consistency, accuracy, and fairness. This can help you decide if you should discuss the grade with the teacher.
          </p>

          <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Important Note</p>
                <p>
                  This is an AI assessment and may not capture all context that the teacher has. It should be used as a starting point for discussion, not as a definitive judgment.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onRequestFairnessCheck}
            className="w-full py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-semibold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Scale className="w-5 h-5" />
            Check Grade Fairness
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Analyzing grading fairness...</p>
          <p className="text-sm text-slate-400 mt-2">This may take 10-20 seconds</p>
        </div>
      </div>
    )
  }

  if (!fairnessResult) return null

  // Show results
  const verdict = fairnessResult.fairnessAnalysis.overallVerdict
  const config = verdictConfig[verdict]
  const VerdictIcon = config.icon

  return (
    <div className={`bg-gradient-to-r ${config.bgGradient} rounded-2xl border-2 ${config.borderColor} overflow-hidden`}>
      {/* Header with Verdict */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <VerdictIcon className={`w-8 h-8 text-${config.color}-600`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={`font-bold text-xl ${config.textColor}`}>
                {verdict === 'FAIR' && 'Grading Appears Fair'}
                {verdict === 'MOSTLY_FAIR' && 'Grading is Mostly Fair'}
                {verdict === 'QUESTIONABLE' && 'Some Questions About Grading'}
                {verdict === 'RECOMMEND_REVIEW' && 'Review Recommended'}
              </h3>
              <span className={`px-2 py-1 bg-white rounded-full text-xs font-bold text-${config.color}-700`}>
                {fairnessResult.fairnessAnalysis.confidenceLevel}% confidence
              </span>
            </div>
            <p className={`${config.textColor} opacity-90`}>
              {fairnessResult.fairnessAnalysis.summaryStatement}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-800">
              {fairnessResult.potentialIssues?.length || 0}
            </p>
            <p className="text-xs text-slate-500">Potential Issues</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-800">
              {fairnessResult.positiveFindings?.length || 0}
            </p>
            <p className="text-xs text-slate-500">Positive Findings</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-slate-800">
              {fairnessResult.pointVerification.discrepancy || 0}
            </p>
            <p className="text-xs text-slate-500">Point Discrepancy</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${
              fairnessResult.consistencyAnalysis.overallConsistency === 'CONSISTENT' 
                ? 'text-emerald-600' 
                : fairnessResult.consistencyAnalysis.overallConsistency === 'MOSTLY_CONSISTENT'
                ? 'text-blue-600'
                : 'text-amber-600'
            }`}>
              {fairnessResult.consistencyAnalysis.overallConsistency === 'CONSISTENT' && '✓'}
              {fairnessResult.consistencyAnalysis.overallConsistency === 'MOSTLY_CONSISTENT' && '~'}
              {fairnessResult.consistencyAnalysis.overallConsistency === 'INCONSISTENT' && '!'}
            </p>
            <p className="text-xs text-slate-500">Consistency</p>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-6 py-3 bg-white/50 border-t border-white flex items-center justify-between hover:bg-white/70 transition-colors"
      >
        <span className="font-medium text-slate-700">
          {showDetails ? 'Hide Detailed Analysis' : 'Show Detailed Analysis'}
        </span>
        {showDetails ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
      </button>

      {/* Detailed Analysis */}
      {showDetails && (
        <div className="bg-white border-t border-slate-200">
          {/* Potential Issues */}
          {fairnessResult.potentialIssues?.length > 0 && (
            <div className="p-6 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Potential Issues Found
              </h4>
              <div className="space-y-4">
                {fairnessResult.potentialIssues.map((issue, idx) => (
                  <div 
                    key={issue.issueId || idx}
                    className={`p-4 rounded-xl border ${
                      issue.severity === 'SIGNIFICANT' ? 'bg-red-50 border-red-200' :
                      issue.severity === 'MODERATE' ? 'bg-amber-50 border-amber-200' :
                      'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        issue.severity === 'SIGNIFICANT' ? 'bg-red-100 text-red-700' :
                        issue.severity === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {issue.severity}
                      </span>
                      <span className="text-xs text-slate-500">
                        {issue.potentialPointsAffected} points
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 mb-2">{issue.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="bg-white/50 rounded-lg p-2">
                        <span className="text-slate-500">Student wrote:</span>
                        <p className="font-mono text-slate-800">"{issue.studentAnswer}"</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2">
                        <span className="text-slate-500">Teacher marked:</span>
                        <p className="font-mono text-slate-800">"{issue.teacherMarking}"</p>
                      </div>
                    </div>
                    {issue.discussionWorthy && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
                        <MessageCircle className="w-4 h-4" />
                        Worth discussing with teacher
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Positive Findings */}
          {fairnessResult.positiveFindings?.length > 0 && (
            <div className="p-6 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-emerald-500" />
                Fair Grading Observed
              </h4>
              <div className="space-y-2">
                {fairnessResult.positiveFindings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-800">{finding.area}</p>
                      <p className="text-sm text-emerald-700">{finding.observation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions for Teacher */}
          {fairnessResult.recommendations?.questionsForTeacher?.length > 0 && (
            <div className="p-6 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Questions to Ask the Teacher
              </h4>
              <div className="space-y-3">
                {fairnessResult.recommendations.questionsForTeacher.map((q, idx) => (
                  <div key={idx} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="font-medium text-blue-800 mb-1">"{q.question}"</p>
                    <p className="text-sm text-blue-600">{q.context}</p>
                    <p className="text-xs text-blue-500 mt-2 italic">
                      Suggested tone: {q.tone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teacher's Perspective */}
          <div className="p-6 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Teacher's Perspective
            </h4>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-sm text-purple-800 mb-3">
                {fairnessResult.teacherPerspective?.benefitOfDoubt}
              </p>
              <p className="text-xs font-medium text-purple-600 uppercase mb-2">
                Context we cannot see:
              </p>
              <ul className="text-sm text-purple-700 space-y-1">
                {fairnessResult.teacherPerspective?.contextWeCannotSee?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Parent Guidance */}
          <div className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-600" />
              Recommended Next Steps
            </h4>
            
            <div className="space-y-4">
              {/* Action Steps */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-medium text-slate-700 mb-3">Action Steps:</p>
                <ol className="space-y-2">
                  {fairnessResult.parentGuidance?.actionableSteps?.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                        {step.step}
                      </span>
                      <div>
                        <p className="text-slate-800">{step.action}</p>
                        <p className="text-sm text-slate-500">{step.expectedOutcome}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* What NOT to do */}
              {fairnessResult.parentGuidance?.whatNotToDo?.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <p className="font-medium text-red-700 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    What to Avoid:
                  </p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {fairnessResult.parentGuidance.whatNotToDo.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span>✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conversation Starter */}
              {fairnessResult.parentGuidance?.conversationStarter && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="font-medium text-blue-700 mb-2">
                    How to Start the Conversation:
                  </p>
                  <p className="text-blue-800 italic">
                    "{fairnessResult.parentGuidance.conversationStarter}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legal Rights (collapsed by default) */}
          <details className="border-t border-slate-200">
            <summary className="p-4 cursor-pointer hover:bg-slate-50 flex items-center gap-2 text-slate-600">
              <Gavel className="w-4 h-4" />
              Your Rights as a Parent
            </summary>
            <div className="px-6 pb-6">
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
                <ul className="space-y-2">
                  {fairnessResult.legalContext?.parentRights?.map((right, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{right}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-400 italic">
                  {fairnessResult.legalContext?.note}
                </p>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default FairnessCheckSection
