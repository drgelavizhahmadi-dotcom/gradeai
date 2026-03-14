import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { RateLimiter, getClientIP } from '@/lib/rate-limit'
import { db } from '@/lib/db'

export const maxDuration = 300

// ===== REQUEST VALIDATION WITH ZOD =====
const independentFairnessSchema = z.object({
  extractedText: z.string()
    .min(10, 'Extracted text must be at least 10 characters')
    .max(50000, 'Extracted text exceeds 50,000 character limit'),
  childName: z.string().optional(),
  grade: z.number().min(1).max(13).optional(),
  subject: z.string().max(100).optional(),
  schoolType: z.enum(['Grundschule', 'Hauptschule', 'Realschule', 'Gymnasium']).optional(),
  language: z.enum(['de', 'en', 'ar', 'tr', 'ro', 'ru', 'fa', 'ku', 'kmr']).default('de'),
  uploadId: z.string().cuid().optional(),
});

type IndependentFairnessRequest = z.infer<typeof independentFairnessSchema>;

// ===== RATE LIMITING =====
const fairnessRateLimiter = new RateLimiter(10, 60 * 1000); // 10 requests per minute

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

const LANGUAGE_NAMES: Record<string, string> = {
  de: 'German (Deutsch)',
  en: 'English',
  ar: 'Arabic (العربية)',
  tr: 'Turkish (Türkçe)',
  ro: 'Romanian (Română)',
  ru: 'Russian (Русский)',
  fa: 'Persian/Farsi (فارسی)',
  ku: 'Kurdish Sorani (کوردی)',
  kmr: 'Kurdish Kurmanji (Kurmancî)',
}

function getLanguageInstruction(lang: string): string {
  const name = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES['de']
  return `IMPORTANT: Write ALL output in ${name}.`
}

// Compact single-step fairness prompt to minimize generation time
const FAIRNESS_PROMPT = `You are a school grading fairness auditor. Analyze the raw OCR test text to:
1. Reconstruct questions, answers, points, and teacher corrections
2. Evaluate grading fairness across: consistency, proportionality, partial credit, clarity, feedback quality, math accuracy
3. Find point recovery opportunities

Be objective, evidence-based, fair to teacher and student.

Output ONLY valid JSON with this structure:
{
  "testReconstruction": {
    "subject": "", "topic": "", "testType": "", "maxPoints": 0, "achievedPoints": 0,
    "calculatedPercentage": 0, "gradeGiven": "",
    "questions": [{"number": 1, "questionText": "", "maxPoints": 0, "pointsGiven": 0, "isCorrect": false, "deductionReason": ""}],
    "teacherComments": {"finalComment": "", "marginNotes": [], "overallTone": ""}
  },
  "fairnessAnalysis": {
    "overallScore": 85,
    "verdict": "fair|mostly_fair|some_concerns|questionable|needs_review",
    "verdictSummary": "",
    "dimensions": {
      "gradingConsistency": {"score": 0, "finding": "", "concern": null},
      "pointProportionality": {"score": 0, "finding": "", "concern": null},
      "partialCredit": {"score": 0, "finding": "", "concern": null},
      "feedbackQuality": {"score": 0, "finding": "", "concern": null},
      "mathematicalAccuracy": {"score": 0, "finding": "", "concern": null}
    },
    "positiveFindings": [{"title": "", "detail": ""}],
    "concerns": [{"title": "", "severity": "minor|moderate|significant", "detail": "", "evidence": "", "recommendation": ""}],
    "gradeBoundaryAnalysis": {
      "currentGrade": "", "currentPoints": 0, "maxPoints": 0, "percentage": 0,
      "nextBetterGrade": "", "pointsNeededForBetter": 0, "potentialRecoverablePoints": 0,
      "couldChangeGrade": false, "analysis": ""
    },
    "pointRecoveryOpportunities": [{"question": "", "currentPoints": 0, "possiblePoints": 0, "argument": "", "strength": "strong|moderate|weak"}],
    "totalPotentialRecovery": "",
    "recommendation": {
      "shouldContactTeacher": false, "urgency": "low|medium|high",
      "approach": "", "specificPoints": [], "sampleOpener": ""
    }
  }
}`

function extractJson(raw: string): string {
  let s = raw.trim()
  const jsonMatch = s.match(/```json\n?([\s\S]*?)\n?```/) || s.match(/```\n?([\s\S]*?)\n?```/)
  if (jsonMatch) s = jsonMatch[1].trim()
  const firstBrace = s.indexOf('{')
  const lastBrace = s.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) s = s.slice(firstBrace, lastBrace + 1)
  s = s.replace(/,\s*([}\]])/g, '$1')
  return s
}

async function fixJsonWithAI(brokenJson: string): Promise<Record<string, unknown>> {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 4096,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Fix this broken JSON. Output ONLY valid JSON.' },
      { role: 'user', content: brokenJson },
    ],
  })
  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('No response from JSON repair')
  return JSON.parse(extractJson(text))
}

export async function POST(request: NextRequest) {
  try {
    // ===== RATE LIMITING CHECK =====
    const clientIp = getClientIP(request)
    const rateLimitResult = fairnessRateLimiter.check(clientIp)
    
    if (!rateLimitResult.success) {
      console.warn(`[Independent Fairness API] Rate limit exceeded for IP: ${clientIp}`)
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
    let validatedData: IndependentFairnessRequest
    
    try {
      validatedData = independentFairnessSchema.parse(rawBody)
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

    const { extractedText, childName, grade, subject, schoolType, language, uploadId } = validatedData

    const languageInstruction = getLanguageInstruction(language)
    console.log('[Independent Fairness API] Starting for:', childName, 'language:', language)
    const startTime = Date.now()

    const userContext = `${languageInstruction}

Student: ${childName || 'Schüler'}, Grade ${grade || '?'}, ${schoolType || '?'}, ${subject || '?'}

RAW TEST TEXT:
${extractedText}

Reconstruct the test and analyze grading fairness. Be thorough but concise.`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 3000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: FAIRNESS_PROMPT },
        { role: 'user', content: userContext },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('No response from fairness analysis')

    const jsonString = extractJson(text)
    let result: Record<string, unknown>
    try {
      result = JSON.parse(jsonString)
    } catch {
      result = await fixJsonWithAI(text)
    }

    const testReconstruction = (result as any).testReconstruction || {}
    const fairnessAnalysis = (result as any).fairnessAnalysis || result

    const totalTime = Date.now() - startTime
    console.log(`[Independent Fairness API] Complete in ${totalTime}ms. Score: ${fairnessAnalysis.overallScore}`)

    const responseData = {
      success: true,
      testReconstruction,
      fairnessAnalysis,
      metadata: {
        studentName: childName,
        subject: testReconstruction.subject || subject,
        generatedAt: new Date().toISOString(),
        totalGenerationTime: `${(totalTime / 1000).toFixed(1)}s`,
        isIndependent: true,
        questionsAnalyzed: testReconstruction.questions?.length || 0,
        concernsFound: fairnessAnalysis.concerns?.length || 0,
        language,
      }
    }

    // Save to DB if uploadId provided
    if (uploadId) {
      try {
        await db.upload.update({
          where: { id: uploadId, userId: session.user.id },
          data: { fairnessCheck: responseData as any },
        })
        console.log('[Independent Fairness API] Saved to DB for uploadId:', uploadId)
      } catch (dbErr) {
        console.error('[Independent Fairness API] DB save failed (non-fatal):', dbErr)
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('[Independent Fairness API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to perform independent fairness analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
