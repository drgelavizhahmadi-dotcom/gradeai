/**
 * DeepSeek AI Integration
 *
 * This module handles communication with DeepSeek (OpenAI-compatible API, cost-effective)
 * for analyzing German school test results.
 */

import OpenAI from 'openai'
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
 * Analyzes a German school test using DeepSeek AI
 *
 * @param params - Test information and student context
 * @returns Structured analysis with insights and recommendations
 * @throws Error if API call fails or response cannot be parsed
 */
export async function analyzeTest(params: AnalyzeTestParams): Promise<TestAnalysis> {
  console.log('[DeepSeek AI] Starting test analysis...')
  console.log('[DeepSeek AI] Subject:', params.subject || 'Unknown')
  console.log('[DeepSeek AI] Grade:', params.grade || 'Unknown')
  console.log('[DeepSeek AI] Student:', params.childName, `(Grade ${params.studentGrade}, ${params.schoolType})`)

  // Validate required parameters
  if (!params.extractedText || params.extractedText.trim().length === 0) {
    throw new Error('Extracted text is required for analysis')
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set')
  }

  try {
    // Initialize DeepSeek client (OpenAI-compatible)
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })

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

    console.log('[DeepSeek AI] Prompt prepared, calling API...')
    console.log(`[DeepSeek AI] Prompt length: ${filledPrompt.length} characters`)

    // Call DeepSeek API
    const startTime = Date.now()
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: filledPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    })

    const duration = Date.now() - startTime
    console.log(`[DeepSeek AI] ✓ API call completed in ${duration}ms`)

    // Extract response text
    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response content from DeepSeek API')
    }

    console.log(`[DeepSeek AI] Response received: ${responseText.length} characters`)

    // Parse JSON response
    let analysis: TestAnalysis
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : responseText

      analysis = JSON.parse(jsonText.trim())
      console.log('[DeepSeek AI] ✓ JSON parsed successfully')
    } catch (parseError) {
      console.error('[DeepSeek AI] ✗ Failed to parse JSON response')
      console.error('[DeepSeek AI] Raw response:', responseText.substring(0, 500))
      throw new Error(`Failed to parse DeepSeek AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Validate response structure
    if (!analysis.gradeInterpretation || !analysis.strengths || !analysis.weaknesses || !analysis.actionPlan) {
      throw new Error('Invalid analysis structure from DeepSeek AI - missing required fields')
    }

    console.log('[DeepSeek AI] ✓ Analysis complete')
    console.log('[DeepSeek AI]   Grade interpretation:', analysis.gradeInterpretation.meaning.substring(0, 100) + '...')
    console.log('[DeepSeek AI]   Strengths:', analysis.strengths.length)
    console.log('[DeepSeek AI]   Weaknesses:', analysis.weaknesses.length)
    console.log('[DeepSeek AI]   Action plan priorities:', Object.keys(analysis.actionPlan).length)

    return analysis

  } catch (error) {
    console.error('[DeepSeek AI] ✗ Analysis failed:', error)
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`DeepSeek AI analysis failed: ${error.message}`)
    }
    throw new Error('DeepSeek AI analysis failed with unknown error')
  }
}
