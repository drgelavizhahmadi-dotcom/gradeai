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
  return `IMPORTANT: Write ALL your analysis and responses in ${name}. All text values in the JSON output must be in ${name}.`
}

// === STEP 1: Independent Test Analysis Agent ===

const TEST_ANALYSIS_PROMPT = `You are an expert at analyzing school test documents. You receive raw OCR-extracted text from a school test and must identify:

1. The subject, topic, and grade level
2. All questions and their point values
3. What the student answered
4. Teacher corrections, marks, and feedback
5. Student weaknesses and knowledge gaps
6. Key concepts that were tested

Be thorough - find every weakness, even subtle ones. Identify the root cause behind each mistake.

Output ONLY valid JSON:
{
  "testAnalysis": {
    "subject": "Detected subject",
    "topic": "Main topic of the test",
    "gradeLevel": "Detected grade level",
    "maxPoints": 0,
    "achievedPoints": 0,
    "gradeGiven": "The grade",
    "keyConceptsTested": ["concept1", "concept2"],
    "weaknesses": [
      {
        "id": "w1",
        "title": "Short title",
        "description": "What went wrong",
        "rootCause": "Why this happened",
        "severity": "critical|high|medium|low",
        "relatedConcept": "The concept this relates to"
      }
    ],
    "strengths": [
      {
        "title": "What went well",
        "evidence": "Specific reference"
      }
    ],
    "teacherFeedback": ["Comment 1", "Comment 2"]
  }
}`

// === STEP 2: Flashcard Generation Agent ===

const FLASHCARD_PROMPT = `You are an expert educational content creator specializing in creating effective learning flashcards for students.

Based on the independent test analysis provided, create personalized flashcards that:
1. Target the SPECIFIC weaknesses identified in the analysis
2. Use age-appropriate language for the student's grade level
3. Include memory tricks and mnemonics where helpful
4. Cover the exact topics and concepts from the test
5. Help the student master material they struggled with

IMPORTANT RULES:
- Create exactly 8-10 flashcards
- Each flashcard should address a specific weakness or knowledge gap
- Front: Clear question or concept to recall
- Back: Concise, memorable answer
- Tip: A memory trick, mnemonic, or study hint
- Make them SPECIFIC to the test content, not generic
- Prioritize critical and high-severity weaknesses

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

async function runAgent(
  agentPrompt: string,
  userContext: string,
  agentName: string,
  temperature: number = 0.5
): Promise<Record<string, unknown>> {
  console.log(`[Flashcards API] Running ${agentName} agent...`)
  const startTime = Date.now()

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 4096,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: agentPrompt },
        { role: 'user', content: userContext },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) {
      throw new Error(`No text content from ${agentName} agent`)
    }

    const jsonString = extractJson(text)

    let result: Record<string, unknown>
    try {
      result = JSON.parse(jsonString)
    } catch (parseError) {
      console.warn(`[Flashcards API] ${agentName} JSON parse failed, using AI repair...`)
      result = await fixJsonWithAI(text)
      console.log(`[Flashcards API] ${agentName} JSON repaired via AI`)
    }

    console.log(`[Flashcards API] ${agentName} agent completed in ${Date.now() - startTime}ms`)
    return result
  } catch (error) {
    console.error(`[Flashcards API] ${agentName} agent error:`, error)
    throw error
  }
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
    console.log('[Flashcards API] Starting independent flashcard generation for:', childName, 'language:', language)
    const overallStart = Date.now()

    // ============================================
    // STEP 1: Analyze the test from raw text
    // ============================================
    const analysisContext = `
${languageInstruction}

=== STUDENT INFORMATION ===
Name: ${childName || 'Schüler'}
Grade/Class: ${grade || 'Unknown'}
School Type: ${schoolType || 'Unknown'}
Subject: ${subject || 'Unknown'}

=== RAW TEST TEXT (OCR Extracted) ===
${extractedText}

=== INSTRUCTIONS ===
Analyze this test independently. Identify ALL weaknesses, errors, knowledge gaps, and key concepts tested.
Focus on finding specific topics the student needs to practice.
`

    const analysisResult = await runAgent(
      TEST_ANALYSIS_PROMPT,
      analysisContext,
      'TestAnalysis',
      0.3
    )

    const testAnalysis = (analysisResult as any).testAnalysis || analysisResult
    console.log('[Flashcards API] Test analyzed:', testAnalysis.weaknesses?.length || 0, 'weaknesses found')

    // ============================================
    // STEP 2: Generate flashcards from analysis
    // ============================================
    const flashcardContext = `
${languageInstruction}

=== INDEPENDENT TEST ANALYSIS ===
${JSON.stringify(testAnalysis, null, 2)}

=== STUDENT CONTEXT ===
Name: ${childName || 'Schüler'}
Grade/Class: ${grade || 'Unknown'}
School Type: ${schoolType || 'Unknown'}
Subject: ${testAnalysis.subject || subject || 'Unknown'}

=== INSTRUCTIONS ===
Create 8-10 targeted flashcards that help this student overcome their specific weaknesses.
Each flashcard should directly address a weakness found in the analysis.
Use age-appropriate language and include helpful memory tricks.
`

    const flashcardResult = await runAgent(
      FLASHCARD_PROMPT,
      flashcardContext,
      'FlashcardGeneration',
      0.7
    )

    const totalTime = Date.now() - overallStart
    console.log(`[Flashcards API] Complete in ${totalTime}ms. Generated ${(flashcardResult as any).flashcards?.length || 0} flashcards`)

    return NextResponse.json({
      success: true,
      ...flashcardResult,
      generatedAt: new Date().toISOString(),
      metadata: {
        studentName: childName,
        subject: testAnalysis.subject || subject,
        generatedAt: new Date().toISOString(),
        totalGenerationTime: `${(totalTime / 1000).toFixed(1)}s`,
        isIndependent: true,
        weaknessesFound: testAnalysis.weaknesses?.length || 0,
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
