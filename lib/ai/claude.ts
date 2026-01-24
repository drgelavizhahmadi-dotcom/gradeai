/**
 * Claude AI Integration
 *
 * This module handles communication with Claude AI (Anthropic)
 * for analyzing German school test results.
 */

import Anthropic from '@anthropic-ai/sdk'
import { TestAnalysis, ANALYSIS_PROMPT } from './prompts'

/**
 * Initialize Anthropic client
 */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
 * Analyzes a German school test using Claude AI
 *
 * @param params - Test information and student context
 * @returns Structured analysis with insights and recommendations
 * @throws Error if API call fails or response cannot be parsed
 */
export async function analyzeTest(params: AnalyzeTestParams): Promise<TestAnalysis> {
  console.log('[Claude AI] Starting test analysis...')
  console.log('[Claude AI] Subject:', params.subject || 'Unknown')
  console.log('[Claude AI] Grade:', params.grade || 'Unknown')
  console.log('[Claude AI] Student:', params.childName, `(Grade ${params.studentGrade}, ${params.schoolType})`)

  // Validate required parameters
  if (!params.extractedText || params.extractedText.trim().length === 0) {
    throw new Error('Extracted text is required for analysis')
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
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

    console.log('[Claude AI] Prompt prepared, calling API...')
    console.log(`[Claude AI] Prompt length: ${filledPrompt.length} characters`)

    // Call Claude API
    const startTime = Date.now()
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: filledPrompt,
        },
      ],
    })

    const duration = Date.now() - startTime
    console.log(`[Claude AI] API call completed in ${duration}ms`)
    console.log('[Claude AI] Response received, parsing JSON...')

    // Extract text content from response
    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API')
    }

    let responseText = content.text
    console.log(`[Claude AI] Response length: ${responseText.length} characters`)
    console.log('[Claude AI] Raw response preview:', responseText.substring(0, 200))

    // Parse JSON response with robust error handling
    let analysis: TestAnalysis
    try {
      // Start with the raw response text
      let cleanedResponse = responseText.trim()

      // Strategy 1: Remove markdown code fences
      cleanedResponse = cleanedResponse
        .replace(/```json\n?/gi, '')  // Remove ```json
        .replace(/```\n?/g, '')        // Remove ```
        .trim()

      // Strategy 2: Extract JSON from potential markdown or text using regex
      // This matches the outermost braces and everything between them
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0]
        console.log('[Claude AI] Extracted JSON via regex match')
      }

      // Strategy 3: Additional cleanup - remove any text before first { or after last }
      const firstBrace = cleanedResponse.indexOf('{')
      const lastBrace = cleanedResponse.lastIndexOf('}')

      if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
        cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1)
        console.log('[Claude AI] Extracted JSON between first { and last }')
      }

      // Strategy 4: Final trim
      cleanedResponse = cleanedResponse.trim()

      console.log('[Claude AI] Cleaned response preview:', cleanedResponse.substring(0, 200))
      console.log('[Claude AI] Cleaned response length:', cleanedResponse.length)
      console.log('[Claude AI] Starts with {:', cleanedResponse.startsWith('{'))
      console.log('[Claude AI] Ends with }:', cleanedResponse.endsWith('}'))
      console.log('[Claude AI] Attempting to parse JSON...')

      // Parse JSON with detailed error reporting
      analysis = JSON.parse(cleanedResponse)
      console.log('[Claude AI] ✓ JSON parsed successfully')
    } catch (parseError) {
      console.error('[Claude AI] ==================== JSON PARSE ERROR ====================')
      console.error('[Claude AI] Error:', parseError instanceof Error ? parseError.message : String(parseError))

      // Extract position from error message if available
      if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
        const posMatch = parseError.message.match(/position (\d+)/)
        if (posMatch) {
          const pos = parseInt(posMatch[1])
          const start = Math.max(0, pos - 50)
          const end = Math.min(responseText.length, pos + 50)
          console.error('[Claude AI] Context around error position:', responseText.substring(start, end))
          console.error('[Claude AI] Error at position', pos, ':', responseText.charAt(pos))
        }
      }

      console.error('[Claude AI] Raw response length:', responseText.length)
      console.error('[Claude AI] Raw response (first 1000 chars):')
      console.error(responseText.substring(0, 1000))
      console.error('[Claude AI] Raw response (last 200 chars):')
      console.error(responseText.substring(Math.max(0, responseText.length - 200)))
      console.error('[Claude AI] =========================================================')

      // Try to provide more specific error information
      if (parseError instanceof SyntaxError) {
        throw new Error(`Failed to parse AI response as JSON. Syntax error: ${parseError.message}. Check logs for details.`)
      }

      throw new Error('Failed to parse AI response as JSON. The response may be malformed or contain non-JSON text.')
    }

    // Validate the structure of the response
    if (!analysis.summary) {
      console.error('[Claude AI] Response missing required fields')
      console.error('[Claude AI] Received:', JSON.stringify(analysis, null, 2).substring(0, 500))
      throw new Error('AI response is missing required fields - expected summary field')
    }

    console.log('[Claude AI] Analysis completed successfully')
    console.log('[Claude AI] Subject:', analysis.summary?.subject)
    console.log('[Claude AI] Grade:', analysis.summary?.overallGrade)
    console.log('[Claude AI] Strengths identified:', analysis.strengths?.length || 0)
    console.log('[Claude AI] Weaknesses identified:', analysis.weaknesses?.length || 0)
    console.log('[Claude AI] Recommendations:', analysis.recommendations?.length || 0)

    return analysis
  } catch (error) {
    console.error('[Claude AI] Error during analysis:', error)

    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      console.error('[Claude AI] Anthropic API Error:')
      console.error('[Claude AI] Status:', error.status)
      console.error('[Claude AI] Message:', error.message)

      if (error.status === 401) {
        throw new Error('Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY environment variable.')
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else if (error.status === 500) {
        throw new Error('Anthropic API is experiencing issues. Please try again later.')
      } else {
        throw new Error(`Anthropic API error: ${error.message}`)
      }
    }

    // Re-throw if it's already a formatted error
    if (error instanceof Error) {
      throw error
    }

    // Generic error
    throw new Error('Failed to analyze test with Claude AI')
  }
}

/**
 * Test the Claude AI connection
 * Useful for debugging and setup verification
 *
 * @returns True if connection is successful
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<boolean> {
  console.log('[Claude AI] Testing API connection...')

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with "OK" if you can hear me.',
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      console.log('[Claude AI] Connection test successful')
      console.log('[Claude AI] Response:', content.text)
      return true
    }

    return false
  } catch (error) {
    console.error('[Claude AI] Connection test failed:', error)
    throw error
  }
}
