import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const maxDuration = 300

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

// Compact single-step flashcard prompt
const FLASHCARD_PROMPT = `You are an educational flashcard creator. Analyze the raw OCR test text, identify student weaknesses, and create 8-10 targeted flashcards.

Rules: Each card targets a specific weakness. Use age-appropriate language. Include memory tricks.

Output ONLY valid JSON:
{
  "flashcards": [
    {"forWeakness": "", "front": "", "back": "", "tip": "", "difficulty": "easy|medium|hard"}
  ],
  "studyPlan": {"dailyGoal": "", "totalTime": "", "reviewSchedule": ""},
  "printInstructions": ""
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { extractedText, childName, grade, subject, schoolType, language = 'de', uploadId } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: 'Missing extracted text' }, { status: 400 })
    }

    const languageInstruction = getLanguageInstruction(language)
    console.log('[Flashcards API] Starting for:', childName, 'language:', language)
    const startTime = Date.now()

    const userContext = `${languageInstruction}

Student: ${childName || 'Schüler'}, Grade ${grade || '?'}, ${schoolType || '?'}, ${subject || '?'}

RAW TEST TEXT:
${extractedText}

Create 8-10 flashcards targeting this student's specific weaknesses from the test.`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: FLASHCARD_PROMPT },
        { role: 'user', content: userContext },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('No response from flashcard generation')

    const jsonString = extractJson(text)
    let result: Record<string, unknown>
    try {
      result = JSON.parse(jsonString)
    } catch {
      result = await fixJsonWithAI(text)
    }

    const totalTime = Date.now() - startTime
    console.log(`[Flashcards API] Complete in ${totalTime}ms. Generated ${(result as any).flashcards?.length || 0} flashcards`)

    const responseData = {
      success: true,
      ...result,
      generatedAt: new Date().toISOString(),
      metadata: {
        studentName: childName,
        subject,
        generatedAt: new Date().toISOString(),
        totalGenerationTime: `${(totalTime / 1000).toFixed(1)}s`,
        isIndependent: true,
        language,
      }
    }

    // Save to DB if uploadId provided
    if (uploadId) {
      try {
        await db.upload.update({
          where: { id: uploadId, userId: session.user.id },
          data: { flashcards: responseData as any },
        })
        console.log('[Flashcards API] Saved to DB for uploadId:', uploadId)
      } catch (dbErr) {
        console.error('[Flashcards API] DB save failed (non-fatal):', dbErr)
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('[Flashcards API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate flashcards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
