'use client'

import React, { useState } from 'react'
import { LanguageProvider, useLanguage } from './LanguageContext'
import { useReportTranslation } from './useReportTranslation'
import { getStaticLabel } from './staticLabels'
import LanguageSelector from './components/LanguageSelector'
import LoadingSpinner from './components/ui/LoadingSpinner'
import GradeBadge from './components/ui/GradeBadge'
import ProgressBar from './components/ui/ProgressBar'
import ExpandableSection from './components/ui/ExpandableSection'
import { 
  FileText, 
  BarChart3, 
  Target, 
  Award, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scale,
  BookOpen,
  Users,
  Calendar,
  Heart,
  Lightbulb
} from 'lucide-react'

interface GradeAIParentReportProps {
  analysisData: any
}

const GradeAIParentReport: React.FC<GradeAIParentReportProps> = ({ analysisData }) => {
  return (
    <LanguageProvider>
      <ReportContent analysisData={analysisData} />
    </LanguageProvider>
  )
}

const ReportContent: React.FC<{ analysisData: any }> = ({ analysisData }) => {
  const { language, isRTL } = useLanguage()
  const { translatedData, isTranslating, error, retranslate } = useReportTranslation(analysisData)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Get static labels for loading states
  const labels = {
    loading: getStaticLabel(language, 'loading'),
    translating: getStaticLabel(language, 'translating'),
    error: getStaticLabel(language, 'error'),
    retry: getStaticLabel(language, 'retry'),
  }
  
  // Show loading while translating
  if (isTranslating || !translatedData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-slate-600">{labels.translating}</p>
        </div>
      </div>
    )
  }
  
  // Show error with retry
  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{labels.error}: {error}</p>
          <button 
            onClick={retranslate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {labels.retry}
          </button>
        </div>
      </div>
    )
  }
  
  const { translatedReport } = translatedData
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="relative max-w-4xl mx-auto px-4 py-6 sm:py-10">
        
        {/* Language Selector */}
        <div className="flex justify-end mb-6">
          <LanguageSelector />
        </div>
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <GradeBadge 
              grade={analysisData.header.grade}
              percentage={analysisData.header.percentage}
            />
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                {translatedReport.header.title}
              </h1>
              <div className="text-slate-600 space-y-1">
                <p className="font-medium">
                  {analysisData.header.subject} • {analysisData.header.gradeLevel}
                </p>
                <p className="text-sm">
                  {analysisData.header.studentName} • {analysisData.header.date}
                </p>
                <p className="text-xs text-slate-500">
                  {translatedReport.header.analyzedOn}
                </p>
              </div>
            </div>
          </div>
          
          {/* Emotional Support Message */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">
                  {translatedReport.emotionalSupport.greeting}
                </p>
                <p className="text-sm text-amber-800">
                  {translatedReport.emotionalSupport.message}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-1 flex gap-1">
          {['overview', 'analysis', 'action', 'strengths'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {translatedReport.tabs[tab as keyof typeof translatedReport.tabs]}
            </button>
          ))}
        </div>
        
        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'overview' && (
            <>
              {/* Exam Structure */}
              <ExpandableSection 
                title={translatedReport.sections.examStructure.title}
                icon={<FileText className="h-5 w-5 text-blue-600" />}
                defaultExpanded={true}
              >
                <div className="space-y-4">
                  {analysisData.examStructure.map((task: any) => (
                    <div key={task.taskNumber} className="border-l-4 border-blue-200 pl-4">
                      <h4 className="font-semibold text-slate-800 mb-2">
                        {translatedReport.sections.examStructure.taskLabels.task} {task.taskNumber}: {task.taskTypeGerman}
                      </h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p><span className="font-medium">{translatedReport.sections.examStructure.taskLabels.topic}:</span> {task.topic}</p>
                        <p><span className="font-medium">{translatedReport.sections.examStructure.taskLabels.requirement}:</span> {task.requirement}</p>
                        {task.wordCountRequired && (
                          <p>
                            <span className="font-medium">{translatedReport.sections.examStructure.taskLabels.wordCount}:</span> {task.wordCountActual}/{task.wordCountRequired}
                            {task.wordCountActual < task.wordCountRequired && (
                              <span className="ml-2 text-orange-600">⚠️</span>
                            )}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">{translatedReport.sections.examStructure.taskLabels.points}:</span> {task.pointsAchieved}/{task.pointsMax}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
              
              {/* Score Breakdown */}
              <ExpandableSection 
                title={translatedReport.sections.scores.title}
                icon={<BarChart3 className="h-5 w-5 text-green-600" />}
                defaultExpanded={true}
              >
                <div className="space-y-4">
                  {analysisData.scores.byTask.map((task: any) => (
                    <div key={task.taskNumber}>
                      <h4 className="font-semibold text-slate-800 mb-3">
                        {translatedReport.sections.examStructure.taskLabels.task} {task.taskNumber}
                      </h4>
                      <div className="space-y-2">
                        {task.criteria.map((criterion: any, idx: number) => (
                          <ProgressBar
                            key={idx}
                            value={criterion.score}
                            max={criterion.maxScore}
                            label={translatedReport.sections.scores.criteriaLabels[criterion.criterionKey] || criterion.criterionKey}
                            critical={criterion.isCritical}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-200">
                    <ProgressBar
                      value={analysisData.scores.overall.achieved}
                      max={analysisData.scores.overall.maximum}
                      label={translatedReport.sections.scores.criteriaLabels.total}
                    />
                  </div>
                </div>
              </ExpandableSection>
              
              {/* Fairness Check */}
              <ExpandableSection 
                title={translatedReport.sections.fairness.title}
                icon={<Scale className="h-5 w-5 text-purple-600" />}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">
                      {translatedReport.sections.fairness.assessmentLabels[analysisData.fairnessAssessment.overallFairness]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {analysisData.fairnessAssessment.reasoning}
                  </p>
                </div>
              </ExpandableSection>
              
              {/* Warnings */}
              {analysisData.riskAssessment.urgencyLevel !== 'none' && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-3">
                        {translatedReport.sections.warnings.title}
                      </h3>
                      {analysisData.recommendedActions.immediate.slice(0, 3).map((action: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 mb-2">
                          <span className="text-red-600">•</span>
                          <span className="text-sm text-red-800">{action.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'analysis' && (
            <ExpandableSection 
              title={translatedReport.sections.errorAnalysis.title}
              icon={<BookOpen className="h-5 w-5 text-orange-600" />}
              defaultExpanded={true}
            >
              <div className="space-y-6">
                {analysisData.errorAnalysis.slice(0, 5).map((error: any, idx: number) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">
                      {error.errorTypeHuman} ({error.frequency}× {translatedReport.sections.errorAnalysis.labels.found})
                    </h4>
                    <div className="space-y-2 mb-3">
                      {error.examples.slice(0, 2).map((example: any, exIdx: number) => (
                        <div key={exIdx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <span className="text-red-700">{example.wrong}</span>
                          </div>
                          <div className="flex items-start gap-2 mt-1">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-green-700">{example.correct}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 rounded p-3 text-sm">
                      <p className="font-medium text-blue-900 mb-1">
                        {translatedReport.sections.errorAnalysis.labels.explanation}:
                      </p>
                      <p className="text-blue-800">{error.explanation}</p>
                      <p className="mt-2 text-xs text-blue-700 font-mono">
                        {translatedReport.sections.errorAnalysis.labels.rule}: {error.rule}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableSection>
          )}
          
          {activeTab === 'action' && (
            <>
              <ExpandableSection 
                title={translatedReport.sections.parentActions.title}
                icon={<Users className="h-5 w-5 text-indigo-600" />}
                defaultExpanded={true}
              >
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800">
                    {translatedReport.sections.parentActions.thisWeekLabel}
                  </h4>
                  {analysisData.recommendedActions.immediate.slice(0, 3).map((action: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{action.action}</span>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
              
              <ExpandableSection 
                title={translatedReport.sections.learningPlan.title}
                icon={<Target className="h-5 w-5 text-green-600" />}
                defaultExpanded={true}
              >
                <div className="space-y-4">
                  {analysisData.recommendedActions.learningPlan.slice(0, 4).map((plan: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-green-400 pl-4">
                      <h4 className="font-semibold text-slate-800 mb-2">
                        {translatedReport.sections.learningPlan.labels.priority} {idx + 1}: {plan.focus}
                      </h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p><span className="font-medium">{translatedReport.sections.learningPlan.labels.duration}:</span> {plan.duration}</p>
                        <p><span className="font-medium">{translatedReport.sections.learningPlan.labels.timeCommitment}:</span> {plan.timeCommitment}</p>
                        <p><span className="font-medium">{translatedReport.sections.learningPlan.labels.goal}:</span> {plan.successMetric}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            </>
          )}
          
          {activeTab === 'strengths' && (
            <ExpandableSection 
              title={translatedReport.sections.strengths.title}
              icon={<Award className="h-5 w-5 text-yellow-600" />}
              defaultExpanded={true}
            >
              <div className="space-y-4">
                {analysisData.strengthsIdentified.map((strength: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-800">{strength.strengthType}</h4>
                      <p className="text-sm text-slate-600">{strength.description}</p>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 rounded-lg">
                  <h4 className="font-semibold text-emerald-900 mb-2">
                    {translatedReport.sections.strengths.outlookTitle}
                  </h4>
                  <p className="text-sm text-emerald-800">
                    {translatedReport.sections.strengths.labels.encouragement}
                  </p>
                </div>
              </div>
            </ExpandableSection>
          )}
        </div>
        
        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">{translatedReport.footer.createdWith}</p>
          <p className="text-xs text-slate-400 mt-1">{translatedReport.footer.disclaimer}</p>
        </footer>
        
      </div>
    </div>
  )
}

export default GradeAIParentReport
