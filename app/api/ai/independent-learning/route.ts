import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/lib/auth'

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

// Compact single-step learning prompt - generates analysis + lessons + worksheets + quiz
const LEARNING_PROMPT = `You are a master teacher. Analyze the raw OCR test text, identify weaknesses, and create targeted learning materials.

Generate: analysis of weaknesses, max 3 lessons, max 2 worksheets (6-8 problems each), 1 diagnostic quiz (5-8 questions).
Focus on root causes. Use age-appropriate language. Align with German Lehrplan.

Output ONLY valid JSON:
{
  "independentAnalysis": {
    "subject": "", "topic": "", "gradeLevel": "",
    "detectedWeaknesses": [{"id": "w1", "title": "", "description": "", "severity": "critical|high|medium|low"}],
    "strengths": [{"title": "", "evidence": ""}],
    "overallAssessment": ""
  },
  "lessons": {"lessons": [
    {"id": "l1", "title": "", "targetWeakness": "w1", "targetWeaknessTitle": "", "difficulty": "foundation|building|mastery", "estimatedTime": "",
     "prerequisiteCheck": {"question": "", "expectedAnswer": "", "ifFailed": ""},
     "content": {"introduction": "", "explanation": "", "keyRules": [], "workedExamples": [{"problem": "", "steps": [], "solution": "", "commonMistake": ""}], "practiceProblems": [{"question": "", "hint": "", "answer": ""}]},
     "memoryAids": {"mnemonic": "", "visualAid": "", "realWorldExample": ""}, "parentGuidance": ""}
  ]},
  "worksheets": {"worksheets": [
    {"id": "ws1", "title": "", "targetWeaknesses": [], "difficulty": "beginner|intermediate|advanced", "estimatedTime": "", "instructions": "", "totalPoints": 0,
     "problems": [{"number": 1, "type": "multiple_choice|fill_blank|short_answer|calculation", "question": "", "options": [], "hint": "", "points": 0, "targetSkill": ""}],
     "answerKey": [{"number": 1, "answer": "", "explanation": ""}],
     "bonusChallenge": {"question": "", "answer": "", "points": 0}}
  ]},
  "quizzes": {"quizzes": [
    {"id": "q1", "title": "", "purpose": "", "targetWeaknesses": [], "timeLimit": "", "passingScore": 70, "totalPoints": 0,
     "questions": [{"number": 1, "question": "", "type": "multiple_choice|true_false|short_answer", "options": [], "correctAnswer": "", "points": 0, "feedbackIfCorrect": "", "feedbackIfWrong": ""}],
     "scoringGuide": {"excellent": {"range": "90-100%", "message": "", "nextStep": ""}, "good": {"range": "70-89%", "message": "", "nextStep": ""}, "needsWork": {"range": "Below 70%", "message": "", "nextStep": ""}}}
  ]}
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

    const { extractedText, childName, grade, subject, schoolType, language = 'de', contentTypes = ['lessons', 'worksheets', 'quizzes'] } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: 'Missing extracted text' }, { status: 400 })
    }

    const languageInstruction = getLanguageInstruction(language)
    console.log('[Independent Learning API] Starting for:', childName, 'language:', language)
    const startTime = Date.now()

    const userContext = `${languageInstruction}

Student: ${childName || 'Schüler'}, Grade ${grade || 5}, ${schoolType || '?'}, ${subject || '?'}

RAW TEST TEXT:
${extractedText}

Analyze weaknesses and generate: ${contentTypes.join(', ')}. Be specific to this test, not generic.`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 6000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: LEARNING_PROMPT },
        { role: 'user', content: userContext },
      ],
    })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('No response from learning material generation')

    const jsonString = extractJson(text)
    let result: Record<string, unknown>
    try {
      result = JSON.parse(jsonString)
    } catch {
      result = await fixJsonWithAI(text)
    }

    const independentAnalysis = (result as any).independentAnalysis || {}

    const totalTime = Date.now() - startTime
    console.log(`[Independent Learning API] Complete in ${totalTime}ms`)

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
      { error: 'Failed to generate independent learning material', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
