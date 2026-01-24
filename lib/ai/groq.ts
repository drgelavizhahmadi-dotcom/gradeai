/**
 * Groq AI Integration
 *
 * This module handles communication with Groq (free, fast alternative to Claude)
 * for analyzing German school test results.
 */

import Groq from 'groq-sdk'
import { TestAnalysis, ANALYSIS_PROMPT } from './prompts'

/**
 * Initialize Groq client
 */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

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
 * Analyzes a German school test using Groq AI
 *
 * @param params - Test information and student context
 * @returns Structured analysis with insights and recommendations
 * @throws Error if API call fails or response cannot be parsed
 */
export async function analyzeTest(params: AnalyzeTestParams): Promise<TestAnalysis> {
  console.log('[Groq AI] Starting test analysis...')
  console.log('[Groq AI] Subject:', params.subject || 'Unknown')
  console.log('[Groq AI] Grade:', params.grade || 'Unknown')
  console.log('[Groq AI] Student:', params.childName, `(Grade ${params.studentGrade}, ${params.schoolType})`)

  // Validate required parameters
  if (!params.extractedText || params.extractedText.trim().length === 0) {
    throw new Error('Extracted text is required for analysis')
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is not set')
  }

  try {
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

    console.log('[Groq AI] Prompt prepared, calling API...')
    console.log(`[Groq AI] Prompt length: ${filledPrompt.length} characters`)

    // Call Groq API with llama-3.1-70b-versatile (fast and free)
    const startTime = Date.now()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'user',
          content: filledPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
    })

    const duration = Date.now() - startTime
    console.log(`[Groq AI] ✓ API call completed in ${duration}ms`)

    // Extract response text
    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response content from Groq API')
    }

    console.log(`[Groq AI] Response received: ${responseText.length} characters`)

    // Parse JSON response
    let analysis: TestAnalysis
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : responseText

      analysis = JSON.parse(jsonText.trim())
      console.log('[Groq AI] ✓ JSON parsed successfully')
    } catch (parseError) {
      console.error('[Groq AI] ✗ Failed to parse JSON response')
      console.error('[Groq AI] Raw response:', responseText.substring(0, 500))
      throw new Error(`Failed to parse Groq AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Validate response structure
    if (!analysis.summary || !analysis.strengths || !analysis.weaknesses) {
      throw new Error('Invalid analysis structure from Groq AI - missing required fields')
    }

    console.log('[Groq AI] ✓ Analysis complete')
    console.log('[Groq AI]   Subject:', analysis.summary?.subject)
    console.log('[Groq AI]   Grade:', analysis.summary?.overallGrade)
    console.log('[Groq AI]   Strengths:', analysis.strengths?.length || 0)
    console.log('[Groq AI]   Weaknesses:', analysis.weaknesses?.length || 0)
    console.log('[Groq AI]   Recommendations:', analysis.recommendations?.length || 0)

    return analysis

  } catch (error) {
    console.error('[Groq AI] ✗ Analysis failed:', error)
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Groq AI analysis failed: ${error.message}`)
    }
    throw new Error('Groq AI analysis failed with unknown error')
  }
}
