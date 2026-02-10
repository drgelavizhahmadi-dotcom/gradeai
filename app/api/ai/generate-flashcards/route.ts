import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/lib/auth'

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
  return `IMPORTANT: Write ALL your responses in ${name}. All text values in the JSON output must be in ${name}.`
}

// === Single-Step Flashcard Generator ===
// Analyzes the test AND generates flashcards in one call to avoid Vercel 60s timeout

const FLASHCARD_PROMPT = `You are an expert educational content creator. You receive raw OCR-extracted text from a school test and must:

1. Analyze the test to identify the student's weaknesses and knowledge gaps
2. Create 8-10 targeted flashcards that address those specific weaknesses

FLASHCARD RULES:
- Each flashcard should address a specific weakness or knowledge gap from the test
- Front: Clear question or concept to recall
- Back: Concise, memorable answer
- Tip: A memory trick, mnemonic, or study hint
- Use age-appropriate language for the student's grade level
- Prioritize critical weaknesses first
- Make them SPECIFIC to the test content, not generic

Output ONLY valid JSON:
{
  "flashcards": [
    {
      "forWeakness": "The specific weakness this card addresses",
      "front": "Question or concept (keep it clear and focused)",
      "back": "Answer (concise but complete)",
      "tip": "Memory trick or study hint",
      "difficulty": "easy|medium|hard"
    }
  ],
  "studyPlan": {
    "dailyGoal": "How many cards to review daily",
    "totalTime": "Estimated time to master all cards",
    "reviewSchedule": "When to review (e.g., 'Day 1, Day 3, Day 7, Day 14')"
  },
  "printInstructions": "Brief instructions for printing and using the cards"
}`

// === Helper Functions ===

function extractJson(raw: string): string {
  let s = raw.trim()

  const jsonMatch = s.match(/```json\n?([\s\S]*?)\n?```/) ||
                    s.match(/```\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    s = jsonMatch[1].trim()
  }

  const firstBrace = s.indexOf('{')
  const lastBrace = s.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1)
  }

  s = s.replace(/,\s*([}\]])/g, '$1')

  return s
}

async function fixJsonWithAI(brokenJson: string): Promise<Record<string, unknown>> {
  console.log('[Flashcards API] Using AI to fix broken JSON...')
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 4096,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a JSON repair tool. You receive broken or malformed JSON and output ONLY the repaired, valid JSON. Fix any syntax errors (unescaped quotes, missing commas, trailing commas, unescaped newlines in strings, etc). Output NOTHING except the valid JSON object.' },
      { role: 'user', content: `Fix this broken JSON and output ONLY valid JSON:\n\n${brokenJson}` },
    ],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('No response from JSON repair')

  const cleaned = extractJson(text)
  return JSON.parse(cleaned)
}

// === Main API Handler ===

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      extractedText,
      childName,
      grade,
      subject,
      schoolType,
      language = 'de',
    } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: 'Missing extracted text' }, { status: 400 })
    }

    const languageInstruction = getLanguageInstruction(language)
    console.log('[Flashcards API] Starting single-step flashcard generation for:', childName, 'language:', language)
    const startTime = Date.now()

    // Single AI call: analyze test + generate flashcards
    const userContext = `
${languageInstruction}

=== STUDENT INFORMATION ===
Name: ${childName || 'Schüler'}
Grade/Class: ${grade || 'Unknown'}
School Type: ${schoolType || 'Unknown'}
Subject: ${subject || 'Unknown'}

=== RAW TEST TEXT (OCR Extracted) ===
${extractedText}

=== INSTRUCTIONS ===
Analyze this test to find the student's weaknesses, then create 8-10 targeted flashcards that help them overcome those weaknesses.
Each flashcard should directly address a specific error or knowledge gap from the test.
Use age-appropriate language and include helpful memory tricks.
`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 4096,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: FLASHCARD_PROMPT },
        { role: 'user', content: userContext },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) {
      throw new Error('No response from flashcard generation')
    }

    const jsonString = extractJson(text)

    let result: Record<string, unknown>
    try {
      result = JSON.parse(jsonString)
    } catch (parseError) {
      console.warn('[Flashcards API] JSON parse failed, using AI repair...')
      result = await fixJsonWithAI(text)
      console.log('[Flashcards API] JSON repaired via AI')
    }

    const totalTime = Date.now() - startTime
    console.log(`[Flashcards API] Complete in ${totalTime}ms. Generated ${(result as any).flashcards?.length || 0} flashcards`)

    return NextResponse.json({
      success: true,
      ...result,
      generatedAt: new Date().toISOString(),
      metadata: {
        studentName: childName,
        subject: subject,
        generatedAt: new Date().toISOString(),
        totalGenerationTime: `${(totalTime / 1000).toFixed(1)}s`,
        isIndependent: true,
        language,
      }
    })

  } catch (error) {
    console.error('[Flashcards API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate flashcards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
