import { useState, useCallback } from 'react'
import { useLanguage } from '../LanguageContext'
import { createFairnessCheckPrompt, StudentContext } from '../prompts/fairnessCheckPrompt'

export interface FairnessResult {
  fairnessAnalysis: {
    overallVerdict: 'FAIR' | 'MOSTLY_FAIR' | 'QUESTIONABLE' | 'RECOMMEND_REVIEW'
    confidenceLevel: number
    summaryStatement: string
  }
  pointVerification: {
    calculatedTotal: number
    statedTotal: number
    discrepancy: number
    discrepancyExplanation: string | null
    mathErrorFound: boolean
  }
  consistencyAnalysis: {
    overallConsistency: 'CONSISTENT' | 'MOSTLY_CONSISTENT' | 'INCONSISTENT'
    consistentAreas: Array<{
      area: string
      observation: string
    }>
    inconsistentAreas: Array<{
      area: string
      example1: string
      example2: string
      pointDifference: number
      concern: string
    }>
  }
  potentialIssues: Array<{
    issueId: string
    issueType: string
    severity: 'MINOR' | 'MODERATE' | 'SIGNIFICANT'
    location: string
    description: string
    studentAnswer: string
    teacherMarking: string
    expectedMarking: string
    potentialPointsAffected: number
    confidence: number
    discussionWorthy: boolean
  }>
  positiveFindings: Array<{
    area: string
    observation: string
  }>
  gradeScaleAnalysis: {
    percentageAchieved: number
    gradeGiven: string
    standardGradeForPercentage: string
    gradeAppropriate: boolean
    explanation: string
  }
  detailedBreakdown: any
  recommendations: {
    forParents: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW'
      recommendation: string
      reasoning: string
      howToApproach: string
    }>
    questionsForTeacher: Array<{
      question: string
      context: string
      tone: string
    }>
    shouldRequestReview: boolean
    reviewJustification: string | null
  }
  teacherPerspective: {
    possibleReasons: string[]
    contextWeCannotSee: string[]
    benefitOfDoubt: string
  }
  comparisonToStandards: any
  parentGuidance: {
    emotionalContext: string
    balancedView: string
    actionableSteps: Array<{
      step: number
      action: string
      expectedOutcome: string
    }>
    whatNotToDo: string[]
    conversationStarter: string
  }
  legalContext: {
    parentRights: string[]
    formalProcesses: string[]
    whenToEscalate: string
    note: string
  }
  metadata: any
}

export const useFairnessCheck = (analysisData: any, imageData?: string) => {
  const { targetLanguage } = useLanguage()
  const [fairnessResult, setFairnessResult] = useState<FairnessResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestFairnessCheck = useCallback(async (studentContext: StudentContext = {}) => {
    setIsLoading(true)
    setError(null)

    // Create abort controller for 30s timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      // Check cache first (only in browser)
      const cacheKey = `fairness-${analysisData.metadata?.analysisTimestamp}`
      
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey)
        
        if (cached) {
          setFairnessResult(JSON.parse(cached))
          setIsLoading(false)
          clearTimeout(timeoutId)
          return
        }
      }

      // Create the English prompt
      const prompt = createFairnessCheckPrompt(imageData || '', analysisData, studentContext)

      // Call AI for fairness analysis
      const response = await fetch('/api/ai/fairness-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageData,
          analysisData,
          targetLanguage
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Fairness check failed')
      }

      const result = await response.json()
      setFairnessResult(result)

      // Cache result (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.setItem(cacheKey, JSON.stringify(result))
      }

    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Fairness check error:', err)
      const errorMsg = err.name === 'AbortError' ? 'Fairness check timeout (30s)' : (err.message || 'Fairness check failed')
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [analysisData, imageData, targetLanguage])

  // Clear cached result
  const clearCache = useCallback(() => {
    const cacheKey = `fairness-${analysisData.metadata?.analysisTimestamp}`
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey)
    }
    setFairnessResult(null)
  }, [analysisData])

  return {
    fairnessResult,
    isLoading,
    error,
    requestFairnessCheck,
    clearCache
  }
}

export default useFairnessCheck
