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

// === Single-Step Learning Material Generator ===
// Analyzes the test AND generates all learning content in one call to avoid Vercel 60s timeout

const LEARNING_PROMPT = `You are a master teacher and educational content creator for school students. You receive raw OCR-extracted text from a school test and must:

1. Analyze the test to identify ALL weaknesses and knowledge gaps
2. Generate targeted learning materials that address those weaknesses

Create the following content:

**LESSONS** (max 3):
- Clear, step-by-step explanations for each major weakness
- Age-appropriate language and examples
- Memory tricks and mnemonics
- Worked examples with common mistakes highlighted

**WORKSHEETS** (max 2):
- Practice problems at progressive difficulty levels
- Mix of problem types (multiple choice, fill blank, short answer, calculation)
- Answer keys with explanations

**QUIZZES** (max 1):
- Diagnostic quiz to test if weaknesses have been overcome
- Feedback for correct and incorrect answers

Output ONLY valid JSON:
{
  "independentAnalysis": {
    "subject": "Detected subject",
    "topic": "Main topic",
    "gradeLevel": "Grade level",
    "detectedWeaknesses": [
      {
        "id": "w1",
        "title": "Weakness title",
        "description": "What went wrong",
        "severity": "critical|high|medium|low"
      }
    ],
    "strengths": [
      { "title": "What went well", "evidence": "Reference" }
    ],
    "overallAssessment": "Brief summary"
  },
  "lessons": {
    "lessons": [
      {
        "id": "l1",
        "title": "Lesson title",
        "targetWeakness": "w1",
        "targetWeaknessTitle": "Human-readable weakness title",
        "difficulty": "foundation|building|mastery",
        "estimatedTime": "15-20 Minuten",
        "prerequisiteCheck": {
          "question": "Quick foundation check question",
          "expectedAnswer": "What a prepared student would answer",
          "ifFailed": "What to do if student can't answer"
        },
        "content": {
          "introduction": "Why this matters",
          "explanation": "Step-by-step explanation with markdown",
          "keyRules": ["Rule 1", "Rule 2"],
          "workedExamples": [
            {
              "problem": "Example problem",
              "steps": ["Step 1", "Step 2"],
              "solution": "Answer with explanation",
              "commonMistake": "What students often do wrong"
            }
          ],
          "practiceProblems": [
            { "question": "Practice question", "hint": "Hint", "answer": "Answer" }
          ]
        },
        "memoryAids": {
          "mnemonic": "Memory trick",
          "visualAid": "Description of helpful visual",
          "realWorldExample": "Daily life connection"
        },
        "parentGuidance": "How parents can help"
      }
    ]
  },
  "worksheets": {
    "worksheets": [
      {
        "id": "ws1",
        "title": "Worksheet title",
        "targetWeaknesses": ["w1"],
        "difficulty": "beginner|intermediate|advanced",
        "estimatedTime": "15-20 Minuten",
        "instructions": "Clear instructions",
        "totalPoints": 30,
        "problems": [
          {
            "number": 1,
            "type": "multiple_choice|fill_blank|short_answer|calculation|matching|true_false",
            "question": "The problem",
            "options": ["A", "B", "C", "D"],
            "hint": "Optional hint",
            "points": 2,
            "targetSkill": "What this tests"
          }
        ],
        "answerKey": [
          { "number": 1, "answer": "Correct answer", "explanation": "Why" }
        ],
        "bonusChallenge": {
          "question": "Extra challenge",
          "answer": "Answer",
          "points": 5
        }
      }
    ]
  },
  "quizzes": {
    "quizzes": [
      {
        "id": "q1",
        "title": "Quiz title",
        "purpose": "What this diagnoses",
        "targetWeaknesses": ["w1"],
        "timeLimit": "10-15 Minuten",
        "passingScore": 70,
        "totalPoints": 20,
        "questions": [
          {
            "number": 1,
            "question": "The question",
            "type": "multiple_choice|true_false|short_answer|calculation",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "Correct answer",
            "points": 2,
            "targetWeakness": "w1",
            "commonMistake": "What students get wrong",
            "feedbackIfCorrect": "Positive feedback",
            "feedbackIfWrong": "Helpful explanation"
          }
        ],
        "scoringGuide": {
          "excellent": { "range": "90-100%", "message": "Feedback", "nextStep": "What to do" },
          "good": { "range": "70-89%", "message": "Feedback", "nextStep": "Focus area" },
          "needsWork": { "range": "Below 70%", "message": "Encouragement", "nextStep": "Action" }
        },
        "retakeRecommendation": "When to retake"
      }
    ]
  }
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
  console.log('[Independent Learning] Using AI to fix broken JSON...')
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
      contentTypes = ['lessons', 'worksheets', 'quizzes'],
    } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: 'Missing extracted text' }, { status: 400 })
    }

    const languageInstruction = getLanguageInstruction(language)
    console.log('[Independent Learning API] Starting single-step generation for:', childName, 'language:', language)
    const startTime = Date.now()

    // Single AI call: analyze test + generate all learning materials
    const userContext = `
${languageInstruction}

=== STUDENT INFORMATION ===
Name: ${childName || 'Schüler'}
Grade/Class: ${grade || 5}
School Type: ${schoolType || 'Unknown'}
Subject: ${subject || 'Unknown'}

=== RAW TEST TEXT (OCR Extracted) ===
${extractedText}

=== INSTRUCTIONS ===
1. Analyze the test to find ALL weaknesses and knowledge gaps.
2. Generate targeted learning content: ${contentTypes.join(', ')}.
Focus on the ROOT CAUSES behind each mistake.
Create content that is specific to this test, not generic.
Align with the German school curriculum (Lehrplan) for this grade level and subject.
`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 8192,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: LEARNING_PROMPT },
        { role: 'user', content: userContext },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) {
      throw new Error('No response from learning material generation')
    }

    const jsonString = extractJson(text)

    let result: Record<string, unknown>
    try {
      result = JSON.parse(jsonString)
    } catch (parseError) {
      console.warn('[Independent Learning] JSON parse failed, using AI repair...')
      result = await fixJsonWithAI(text)
      console.log('[Independent Learning] JSON repaired via AI')
    }

    const independentAnalysis = (result as any).independentAnalysis || {}

    const totalTime = Date.now() - startTime
    console.log(`[Independent Learning API] Complete in ${totalTime}ms. Generated: ${contentTypes.join(', ')}`)

    return NextResponse.json({
      success: true,
      ...result,
      metadata: {
        studentName: childName,
        subject: independentAnalysis.subject || subject,
        gradeLevel: independentAnalysis.gradeLevel || grade,
        schoolType,
        generatedAt: new Date().toISOString(),
        contentTypes,
        totalGenerationTime: `${(totalTime / 1000).toFixed(1)}s`,
        isIndependent: true,
        weaknessesFound: independentAnalysis.detectedWeaknesses?.length || 0,
        language,
      }
    })

  } catch (error) {
    console.error('[Independent Learning API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate independent learning material',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
