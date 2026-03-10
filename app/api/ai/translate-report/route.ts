// app/api/ai/translate-report/route.ts
// On-demand report translation endpoint using DeepSeek
// Saves translations to DB for reuse (create once, read many times)

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { SUPPORTED_LANGUAGES, LanguageCode } from '@/lib/ai/analyze-complete'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const maxDuration = 300

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

// Robust JSON extraction
function extractJSON(text: string): any {
  try {
    return JSON.parse(text.trim())
  } catch { }

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch { }
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch { }
  }

  throw new Error('Could not extract valid JSON from response')
}

// Preserve structure from original
function preserveStructure(original: any, translated: any): any {
  if (!original || typeof original !== 'object') return translated
  if (!translated || typeof translated !== 'object') return original

  if (Array.isArray(original)) {
    if (!Array.isArray(translated) || translated.length === 0) {
      return original
    }
    return original.map((item, i) => {
      if (i < translated.length) {
        return preserveStructure(item, translated[i])
      }
      return item
    })
  }

  const result: any = { ...translated }

  for (const key of Object.keys(original)) {
    if (key === '_meta') continue

    if (!(key in result) || result[key] === null || result[key] === undefined) {
      result[key] = original[key]
    } else if (typeof original[key] === 'object' && original[key] !== null) {
      result[key] = preserveStructure(original[key], result[key])
    }
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { report, targetLanguage, uploadId } = await request.json()

    if (!report || !targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'Missing report or targetLanguage' },
        { status: 400 }
      )
    }

    // Check if language is supported
    if (!(targetLanguage in SUPPORTED_LANGUAGES)) {
      return NextResponse.json(
        { success: false, error: `Unsupported language: ${targetLanguage}` },
        { status: 400 }
      )
    }

    const lang = SUPPORTED_LANGUAGES[targetLanguage as LanguageCode]

    // If German, return as-is (German is the source of truth in DB)
    if (targetLanguage === 'de') {
      return NextResponse.json({
        success: true,
        translatedReport: {
          ...report,
          _meta: {
            language: { code: 'de', name: 'German', native: 'Deutsch', rtl: false },
          },
        },
        cached: false,
      })
    }

    // Check DB cache first (if uploadId provided)
    if (uploadId) {
      try {
        const cached = await db.reportTranslation.findUnique({
          where: {
            uploadId_language: { uploadId, language: targetLanguage },
          },
        })

        if (cached) {
          console.log(`[Translate API] Cache hit for ${uploadId} → ${targetLanguage}`)
          return NextResponse.json({
            success: true,
            translatedReport: cached.report,
            cached: true,
          })
        }
      } catch (dbError) {
        console.warn('[Translate API] DB cache lookup failed, proceeding with translation:', dbError)
      }
    }

    console.log(`[Translate API] Translating report to ${lang.name}...`)
    const startTime = Date.now()

    // Get the original German report (strip any existing _meta)
    const { _meta, _germanOriginal, ...cleanReport } = report

    const translationPrompt = `Translate this German school report to ${lang.name} (${lang.native}).

CRITICAL RULES:
1. Translate ONLY the text values, NOT the JSON field names
2. Keep ALL fields and arrays - do NOT remove any
3. Student names should NOT be translated
4. Grade values (numbers like 1-6) should NOT change
5. Keep the warm, empathetic tone
6. Output ONLY valid JSON - no explanations
7. Translate EVERY German text value - leave NOTHING in German

IMPORTANT: The translated JSON MUST have the exact same structure with ALL fields:
- student, test, grade, teacherFeedback, errorAnalysis
- strengths (array), weaknesses (array)
- flashcards (array - MUST keep all items)
- exercises (array - MUST keep all items)
- weeklyPlan (with week1 and week2)
- fairnessCheck (with verdict, reasoning, etc.)
- parentTips (with howToDiscuss, whatToAvoid, motivation)
- resources, messages, summary

GERMAN REPORT:
${JSON.stringify(cleanReport, null, 2)}

Respond with ONLY the translated JSON. No explanations.`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 8000,
      messages: [{ role: 'user', content: translationPrompt }],
    })

    const responseText = response.choices[0]?.message?.content || ''

    let translatedReport = extractJSON(responseText)

    // Preserve structure
    translatedReport = preserveStructure(cleanReport, translatedReport)

    // Add language metadata
    translatedReport._meta = {
      language: {
        code: targetLanguage,
        name: lang.name,
        native: lang.native,
        rtl: lang.rtl,
      },
      translatedFrom: 'de',
    }

    const duration = Date.now() - startTime
    console.log(`[Translate API] Done in ${duration}ms`)

    // Save to DB for future reuse (if uploadId provided)
    if (uploadId) {
      try {
        await db.reportTranslation.upsert({
          where: {
            uploadId_language: { uploadId, language: targetLanguage },
          },
          create: {
            uploadId,
            language: targetLanguage,
            report: translatedReport,
          },
          update: {
            report: translatedReport,
          },
        })
        console.log(`[Translate API] Saved translation to DB: ${uploadId} → ${targetLanguage}`)
      } catch (dbError) {
        // Don't fail the request if DB save fails — translation still works
        console.error('[Translate API] Failed to save translation to DB:', dbError)
      }
    }

    return NextResponse.json({
      success: true,
      translatedReport,
      cached: false,
      duration,
    })
  } catch (error) {
    console.error('[Translate API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      },
      { status: 500 }
    )
  }
}
