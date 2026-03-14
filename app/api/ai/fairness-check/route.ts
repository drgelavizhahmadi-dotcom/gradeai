import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { RateLimiter, getClientIP } from '@/lib/rate-limit'

export const maxDuration = 300

// ===== REQUEST VALIDATION WITH ZOD =====
const fairnessCheckSchema = z.object({
  prompt: z.string()
    .min(20, 'Prompt must be at least 20 characters')
    .max(5000, 'Prompt exceeds 5,000 character limit'),
  imageData: z.string().optional(),
  analysisData: z.object({}).optional(),
  targetLanguage: z.enum(['de', 'en', 'ar', 'tr', 'ro', 'ru', 'fa', 'ku', 'kmr']).default('de'),
});

type FairnessCheckRequest = z.infer<typeof fairnessCheckSchema>;

// ===== RATE LIMITING =====
const fairnessCheckRateLimiter = new RateLimiter(15, 60 * 1000); // 15 requests per minute

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // ===== RATE LIMITING CHECK =====
    const clientIp = getClientIP(request)
    const rateLimitResult = fairnessCheckRateLimiter.check(clientIp)
    
    if (!rateLimitResult.success) {
      console.warn(`[Fairness Check API] Rate limit exceeded for IP: ${clientIp}`)
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    // ===== AUTHENTICATION =====
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ===== REQUEST VALIDATION =====
    const rawBody = await request.json()
    let validatedData: FairnessCheckRequest
    
    try {
      validatedData = fairnessCheckSchema.parse(rawBody)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid request parameters',
            issues: error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        )
      }
      throw error
    }

    const { prompt, imageData, analysisData, targetLanguage } = validatedData
    
    console.log(`[Fairness Check API] Running fairness check analysis in ${targetLanguage}...`)
    const startTime = Date.now()

    const messages: any[] = [
      {
        role: 'user',
        content: imageData 
          ? [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageData,
                },
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          : prompt
      }
    ]
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      temperature: 0.3, // Lower temperature for more objective analysis
      messages
    })
    
    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    if (!textBlock) {
      throw new Error('No text content in response')
    }
    const analysisText = textBlock.text
    
    // Parse the JSON response
    let fairnessData
    try {
      // Handle potential markdown code blocks
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisText.match(/```\n?([\s\S]*?)\n?```/)
      const jsonString = jsonMatch ? jsonMatch[1] : analysisText
      fairnessData = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('[Fairness Check API] Failed to parse fairness check:', parseError)
      console.error('[Fairness Check API] Raw response:', analysisText)
      return NextResponse.json(
        { error: 'Fairness check parsing failed', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 500 }
      )
    }
    
    const totalTime = Date.now() - startTime
    console.log(`[Fairness Check API] Complete in ${totalTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: fairnessData,
      metadata: {
        language: targetLanguage,
        generatedAt: new Date().toISOString(),
        totalGenerationTime: `${(totalTime / 1000).toFixed(1)}s`,
      }
    })
    
  } catch (error) {
    console.error('[Fairness Check API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Fairness check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
