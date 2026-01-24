/**
 * Google Gemini AI Integration
 *
 * This module handles communication with Google Gemini (free tier available)
 * for analyzing German school test results.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { TestAnalysis, ANALYSIS_PROMPT } from './prompts'

/**
 * Parameters for test analysis
 */
export interface AnalyzeTestParams {
  subject: string | null
  grade: string | null
  teacherComment: string | null
  extractedText: string
  childName: string
  studentGrade: number
  schoolType: string
  previousTests?: string
}

/**
 * Analyzes a German school test using Google Gemini AI
 *
 * @param params - Test information and student context
 * @returns Structured analysis with insights and recommendations
 * @throws Error if API call fails or response cannot be parsed
 */
export async function analyzeTest(params: AnalyzeTestParams): Promise<TestAnalysis> {
  console.log('[Gemini AI] Starting test analysis...')
  console.log('[Gemini AI] Subject:', params.subject || 'Unknown')
  console.log('[Gemini AI] Grade:', params.grade || 'Unknown')
  console.log('[Gemini AI] Student:', params.childName, `(Grade ${params.studentGrade}, ${params.schoolType})`)

  // Validate required parameters
  if (!params.extractedText || params.extractedText.trim().length === 0) {
    throw new Error('Extracted text is required for analysis')
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Fill in the prompt template with actual values
    const filledPrompt = ANALYSIS_PROMPT
      .replace(/{subject}/g, params.subject || 'Unknown')
      .replace(/{grade}/g, params.grade || 'No grade provided')
      .replace(/{teacherComment}/g, params.teacherComment || 'No teacher comment provided')
      .replace(/{extractedText}/g, params.extractedText)
      .replace(/{childName}/g, params.childName)
      .replace(/{previousTests}/g, params.previousTests || '')
      .replace(/{studentGrade}/g, params.studentGrade.toString())
      .replace(/{schoolType}/g, params.schoolType)

    console.log('[Gemini AI] Prompt prepared, calling API...')
    console.log(`[Gemini AI] Prompt length: ${filledPrompt.length} characters`)

    // Call Gemini API
    const startTime = Date.now()
    const result = await model.generateContent(filledPrompt)
    const response = result.response
    const duration = Date.now() - startTime
    console.log(`[Gemini AI] ✓ API call completed in ${duration}ms`)

    // Extract response text
    const responseText = response.text()
    if (!responseText) {
      throw new Error('No response content from Gemini API')
    }

    console.log(`[Gemini AI] Response received: ${responseText.length} characters`)

    // Parse JSON response
    let analysis: TestAnalysis
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : responseText

      analysis = JSON.parse(jsonText.trim())
      console.log('[Gemini AI] ✓ JSON parsed successfully')
    } catch (parseError) {
      console.error('[Gemini AI] ✗ Failed to parse JSON response')
      console.error('[Gemini AI] Raw response:', responseText.substring(0, 500))
      throw new Error(`Failed to parse Gemini AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Validate response structure
    if (!analysis.summary || !analysis.strengths || !analysis.weaknesses) {
      throw new Error('Invalid analysis structure from Gemini AI - missing required fields')
    }

    console.log('[Gemini AI] ✓ Analysis complete')
    console.log('[Gemini AI]   Subject:', analysis.summary?.subject)
    console.log('[Gemini AI]   Grade:', analysis.summary?.overallGrade)
    console.log('[Gemini AI]   Strengths:', analysis.strengths?.length || 0)
    console.log('[Gemini AI]   Weaknesses:', analysis.weaknesses?.length || 0)
    console.log('[Gemini AI]   Recommendations:', analysis.recommendations?.length || 0)

    return analysis

  } catch (error) {
    console.error('[Gemini AI] ✗ Analysis failed:', error)
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Gemini AI analysis failed: ${error.message}`)
    }
    throw new Error('Gemini AI analysis failed with unknown error')
  }
}
