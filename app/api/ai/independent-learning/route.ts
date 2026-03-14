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
  return `CRITICAL: Write ALL text content in ${name}. Every explanation, instruction, question, answer, feedback, and label must be in ${name}.`
}

// Rich, pedagogically-structured prompt for personalized learning materials
const LEARNING_PROMPT = `You are an expert educational content creator and master teacher for German schools (Gymnasium, Realschule, Hauptschule).

Analyze the raw OCR test text provided and create comprehensive, highly personalized learning materials that:
1. Target the SPECIFIC weaknesses revealed in THIS test
2. Explain concepts using CONCRETE examples from the test content
3. Build understanding from foundation to mastery
4. Include memory techniques and real-world connections
5. Provide graduated practice from simple to complex
6. Give parents actionable guidance for supporting learning at home

QUALITY STANDARDS:
- Lessons must have STEP-BY-STEP explanations with actual worked examples
- Worksheets must have SPECIFIC problems with real numbers/content from the test topic
- Quiz questions must test UNDERSTANDING, not just recall
- All content must match the student's grade level
- Parent guidance must be SPECIFIC and ACTIONABLE

Output ONLY valid JSON matching this exact structure:
{
  "independentAnalysis": {
    "subject": "exact subject name from test",
    "topic": "specific topic(s) covered in the test",
    "gradeLevel": "grade level as string",
    "performanceSummary": "2-3 sentence honest summary of how the student performed and what gaps it reveals",
    "detectedWeaknesses": [
      {
        "id": "w1",
        "title": "Specific weakness name (e.g. 'Bruchrechnung: Nenner angleichen')",
        "description": "Detailed explanation of what the student got wrong and why it matters for future learning",
        "severity": "critical|high|medium|low",
        "affectedQuestions": ["Q1", "Q3"],
        "rootCause": "Underlying reason for the difficulty (missing prerequisite, conceptual gap, procedural error, careless mistake)",
        "frequencyInTest": "How often this error pattern appeared"
      }
    ],
    "strengths": [
      {"title": "Strength name", "evidence": "Specific evidence from the test showing mastery"}
    ],
    "learningPriorities": ["Most urgent weakness to fix first", "Second priority", "Third priority"],
    "overallAssessment": "Encouraging, honest assessment of the student's current level and clear potential for improvement"
  },
  "learningPlan": {
    "totalStudyTime": "Total estimated study time (e.g. 4-6 Stunden über 2 Wochen)",
    "dailySchedule": "Recommended daily study time (e.g. 20-30 Minuten pro Tag)",
    "weeklyGoals": {
      "week1": "Concrete, measurable goal for week 1",
      "week2": "Concrete, measurable goal for week 2"
    },
    "milestones": [
      {"after": "2 Tage", "check": "What the student should be able to do after 2 days of study"},
      {"after": "1 Woche", "check": "What the student should be able to do after 1 week"},
      {"after": "2 Wochen", "check": "What the student should be able to do after 2 weeks"}
    ]
  },
  "lessons": {
    "lessons": [
      {
        "id": "l1",
        "title": "Specific lesson title (e.g. 'Lektion 1: Nenner angleichen beim Addieren von Brüchen')",
        "targetWeakness": "w1",
        "targetWeaknessTitle": "Name of the weakness this lesson addresses",
        "difficulty": "foundation|building|mastery",
        "estimatedTime": "e.g. 20-25 Minuten",
        "learningObjective": "By the end of this lesson, the student will be able to [specific measurable skill]",
        "prerequisiteCheck": {
          "question": "Simple question to verify prerequisite knowledge",
          "expectedAnswer": "What a correct answer looks like",
          "ifFailed": "Specific simpler review to do first if student cannot answer"
        },
        "content": {
          "introduction": "Engaging hook: why this topic matters in real life, what problem it solves",
          "coreExplanation": "Clear step-by-step explanation of the concept. Use plain language. Break into numbered steps. Bold key terms with **asterisks**.",
          "keyRules": [
            "Rule 1 stated simply and precisely",
            "Rule 2 stated simply and precisely"
          ],
          "workedExamples": [
            {
              "problem": "Specific example problem (similar to what appeared on the test)",
              "steps": [
                "Step 1: [what to do and why]",
                "Step 2: [what to do and why]",
                "Step 3: [what to do and why]"
              ],
              "solution": "Final answer with clear explanation of why it is correct",
              "commonMistake": "The most common error students make here and exactly why it is wrong"
            }
          ],
          "practiceProblems": [
            {"number": 1, "question": "Easy practice question", "hint": "Helpful hint if stuck", "answer": "Answer with brief explanation"},
            {"number": 2, "question": "Medium difficulty practice question", "hint": "Helpful hint if stuck", "answer": "Answer with brief explanation"},
            {"number": 3, "question": "Slightly harder practice question", "hint": "Helpful hint if stuck", "answer": "Answer with brief explanation"}
          ]
        },
        "memoryAids": {
          "mnemonic": "A memorable rule, rhyme, or acronym to remember the key concept",
          "visualAid": "Description of a diagram, number line, color-coding, or visual representation that helps",
          "realWorldExample": "Concrete real-world situation where exactly this concept is used (age-appropriate)"
        },
        "parentGuidance": "Specific, actionable advice: how to explain this concept at home, what to practice together, what mistakes to watch for, how to check understanding"
      }
    ]
  },
  "worksheets": {
    "worksheets": [
      {
        "id": "ws1",
        "title": "Worksheet title (e.g. 'Übungsblatt: Bruchrechnung – Grundlagen')",
        "targetWeaknesses": ["w1"],
        "difficulty": "beginner|intermediate|advanced",
        "estimatedTime": "15-20 Minuten",
        "instructions": "Clear, friendly instructions for the student",
        "totalPoints": 20,
        "problems": [
          {
            "number": 1,
            "type": "multiple_choice|fill_blank|short_answer|calculation|matching",
            "question": "Specific problem with actual numbers/content (not generic)",
            "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
            "hint": "Optional hint to guide struggling students",
            "points": 2,
            "targetSkill": "What specific micro-skill this problem practices"
          }
        ],
        "answerKey": [
          {
            "number": 1,
            "answer": "Correct answer",
            "explanation": "Why this is correct - helps students learn from the answer key"
          }
        ],
        "bonusChallenge": {
          "question": "An extra challenging extension question for fast learners",
          "answer": "Answer with full explanation",
          "points": 3
        }
      }
    ]
  },
  "quizzes": {
    "quizzes": [
      {
        "id": "q1",
        "title": "Lernkontrolle: [Subject/Topic]",
        "purpose": "Check understanding after studying the lessons - identifies remaining gaps",
        "targetWeaknesses": ["w1", "w2"],
        "timeLimit": "10-15 Minuten",
        "passingScore": 70,
        "totalPoints": 20,
        "questions": [
          {
            "number": 1,
            "question": "Question that tests conceptual understanding",
            "type": "multiple_choice|true_false|short_answer",
            "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
            "correctAnswer": "The correct answer",
            "points": 2,
            "feedbackIfCorrect": "Positive reinforcement + deepen understanding with a connection or extension",
            "feedbackIfWrong": "Specific corrective guidance: explain the mistake, show the right approach, encourage"
          }
        ],
        "scoringGuide": {
          "excellent": {
            "range": "90-100%",
            "message": "Enthusiastic congratulations with specific praise",
            "nextStep": "What to do next - advance to harder material or new topic"
          },
          "good": {
            "range": "70-89%",
            "message": "Positive message identifying which area to review",
            "nextStep": "Specific lesson or problem type to review"
          },
          "needsWork": {
            "range": "Below 70%",
            "message": "Encouraging message that does not discourage - frame it as progress",
            "nextStep": "Return to a specific lesson, then retry the quiz"
          }
        }
      }
    ]
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
      uploadId,
    } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: 'Missing extracted text' }, { status: 400 })
    }

    const languageInstruction = getLanguageInstruction(language)
    console.log('[Independent Learning API] Starting for:', childName, 'language:', language)
    const startTime = Date.now()

    const userContext = `${languageInstruction}

STUDENT PROFILE:
- Name: ${childName || 'Schüler'}
- Grade/Class: ${grade || 5}
- School Type: ${schoolType || 'Gymnasium'}
- Subject: ${subject || 'Unknown'}

RAW TEST TEXT (OCR extracted - may contain noise):
${extractedText}

TASK: Analyze this student's specific test performance. Create personalized learning materials for: ${contentTypes.join(', ')}.
Focus on the SPECIFIC errors visible in this test. Do not generate generic content. Every example, problem, and explanation should relate to the actual mistakes this student made.`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 8000,
      temperature: 0.6,
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
    console.log(`[Independent Learning API] Complete in ${totalTime}ms. Weaknesses: ${independentAnalysis.detectedWeaknesses?.length || 0}`)

    const responseData = {
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
        curriculumTopicsMatched: independentAnalysis.learningPriorities?.length || 0,
        language,
      }
    }

    // Save to DB if uploadId provided
    if (uploadId) {
      try {
        await db.upload.update({
          where: { id: uploadId, userId: session.user.id },
          data: { learningMaterial: responseData as any },
        })
        console.log('[Independent Learning API] Saved to DB for uploadId:', uploadId)
      } catch (dbErr) {
        console.error('[Independent Learning API] DB save failed (non-fatal):', dbErr)
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('[Independent Learning API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate independent learning material', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
