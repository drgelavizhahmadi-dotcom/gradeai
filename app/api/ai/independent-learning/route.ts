import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/lib/auth'
import { findRelevantTopics, getPrerequisites, CurriculumTopic } from '@/lib/curriculum/german-lehrplan'

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

// === STEP 1: Independent Analysis Agent ===
// This agent works directly from raw test text - no dependency on the main analysis pipeline

const ANALYSIS_AGENT_PROMPT = `You are an expert educational analyst for schools. Your task is to independently analyze a student's test (from raw extracted text) and identify:

1. ALL weaknesses and knowledge gaps
2. Teacher feedback and correction patterns
3. The specific topics and skills tested
4. Error patterns and misconceptions

You work INDEPENDENTLY from any other analysis. You look at the raw test text and make your own assessment.

RULES:
- Be thorough - find every weakness, even subtle ones
- Identify the root cause behind each weakness (not just the symptom)
- Extract teacher comments, margin notes, and correction marks
- Determine the difficulty level and curriculum alignment

Output ONLY valid JSON:
{
  "independentAnalysis": {
    "subject": "Detected subject",
    "topic": "Main topic of the test",
    "gradeLevel": "Detected or estimated grade level",
    "detectedWeaknesses": [
      {
        "id": "w1",
        "title": "Short title of weakness",
        "description": "Detailed description of what went wrong",
        "rootCause": "Why this happened (misconception, knowledge gap, carelessness, etc.)",
        "severity": "critical|high|medium|low",
        "affectedSkills": ["skill1", "skill2"],
        "evidenceFromTest": "Specific quote or reference from test text"
      }
    ],
    "teacherFeedback": {
      "mainComments": ["Comment 1", "Comment 2"],
      "correctionPatterns": ["Pattern 1", "Pattern 2"],
      "overallTone": "encouraging|neutral|critical|mixed",
      "specificSuggestions": ["Suggestion 1"]
    },
    "strengths": [
      {
        "title": "What student did well",
        "evidence": "Specific reference"
      }
    ],
    "overallAssessment": "Brief summary of student's performance and main areas to focus on",
    "prioritizedLearningNeeds": ["Most important need first", "Second", "Third"]
  }
}`

// === STEP 2: Targeted Lesson Generator ===

const LESSON_GENERATOR_PROMPT = `You are a master teacher creating TARGETED lessons for school students.

You receive an independent analysis of a student's test weaknesses. Your job is to create lessons that DIRECTLY address each weakness with:
- Clear, step-by-step explanations
- Age-appropriate language and examples
- Visual descriptions (diagrams, number lines, tables)
- Real-world connections
- Memory tricks and mnemonics

RULES:
- Create ONE lesson per major weakness (max 4 lessons)
- Each lesson should be self-contained and actionable
- Include prerequisite checks
- Build from foundation to mastery
- Reference the curriculum where applicable

Output ONLY valid JSON:
{
  "lessons": [
    {
      "id": "l1",
      "title": "Lesson title",
      "targetWeakness": "The specific weakness this addresses (use the weakness ID)",
      "targetWeaknessTitle": "Human-readable weakness title",
      "difficulty": "foundation|building|mastery",
      "estimatedTime": "15-20 Minuten",
      "prerequisiteCheck": {
        "question": "Quick question to check if student has the foundation",
        "expectedAnswer": "What a prepared student would answer",
        "ifFailed": "What to do if student can't answer this"
      },
      "content": {
        "introduction": "Why this topic matters and what we'll learn",
        "explanation": "Clear, detailed step-by-step explanation with markdown formatting",
        "keyRules": ["Rule 1 to remember", "Rule 2", "Rule 3"],
        "workedExamples": [
          {
            "problem": "Example problem",
            "steps": ["Step 1: description", "Step 2: description"],
            "solution": "Final answer with explanation",
            "commonMistake": "What students often do wrong here"
          }
        ],
        "practiceProblems": [
          {
            "question": "Practice question",
            "hint": "Helpful hint",
            "answer": "Correct answer"
          }
        ]
      },
      "memoryAids": {
        "mnemonic": "Memory trick or rhyme",
        "visualAid": "Description of a diagram or visual that helps",
        "realWorldExample": "How this appears in daily life"
      },
      "parentGuidance": "How parents can help practice this at home"
    }
  ]
}`

// === STEP 3: Practice Worksheet Generator ===

const WORKSHEET_GENERATOR_PROMPT = `You are an educational worksheet designer creating TARGETED practice materials for school students.

You receive an independent analysis of a student's test weaknesses. Create worksheets that:
- Start easy and get progressively harder
- Focus specifically on identified weaknesses
- Include varied problem types
- Provide answer keys with explanations

RULES:
- Create 2-3 worksheets at different difficulty levels
- 6-10 problems per worksheet
- Mix of problem types (multiple choice, fill blank, short answer, calculation, matching)
- Include point values
- Provide hints for struggling students
- Add bonus challenges for fast learners

Output ONLY valid JSON:
{
  "worksheets": [
    {
      "id": "ws1",
      "title": "Worksheet title",
      "targetWeaknesses": ["weakness ID 1", "weakness ID 2"],
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "15-20 Minuten",
      "instructions": "Clear instructions for the student",
      "totalPoints": 30,
      "problems": [
        {
          "number": 1,
          "type": "multiple_choice|fill_blank|short_answer|calculation|matching|true_false",
          "question": "The problem/question",
          "options": ["A", "B", "C", "D"],
          "hint": "Optional hint for struggling students",
          "points": 2,
          "targetSkill": "What this tests"
        }
      ],
      "answerKey": [
        {
          "number": 1,
          "answer": "Correct answer",
          "explanation": "Why this is correct and how to solve it"
        }
      ],
      "bonusChallenge": {
        "question": "Extra challenge for fast learners",
        "answer": "Answer",
        "points": 5
      }
    }
  ]
}`

// === STEP 4: Diagnostic Quiz Generator ===

const QUIZ_GENERATOR_PROMPT = `You are an assessment specialist creating DIAGNOSTIC quizzes for school students.

You receive an independent analysis of a student's test weaknesses. Create quizzes that:
- Assess whether the student has overcome their weaknesses
- Test conceptual understanding, not just memorization
- Include questions that reveal common misconceptions
- Provide diagnostic feedback for each answer

RULES:
- Create 1-2 diagnostic quizzes
- 5-8 questions per quiz
- Mix of difficulty levels within each quiz
- Include questions that specifically test the identified weak areas
- Provide detailed feedback for both correct and incorrect answers
- Include a scoring guide with actionable next steps

Output ONLY valid JSON:
{
  "quizzes": [
    {
      "id": "q1",
      "title": "Quiz title",
      "purpose": "What this quiz diagnoses",
      "targetWeaknesses": ["weakness ID 1"],
      "timeLimit": "10-15 Minuten",
      "passingScore": 70,
      "totalPoints": 20,
      "questions": [
        {
          "number": 1,
          "question": "The question",
          "type": "multiple_choice|true_false|short_answer|calculation",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "The correct answer",
          "points": 2,
          "targetWeakness": "Which weakness this tests",
          "commonMistake": "What students often get wrong and why",
          "feedbackIfCorrect": "Positive reinforcement + what this shows",
          "feedbackIfWrong": "Helpful explanation of correct approach"
        }
      ],
      "scoringGuide": {
        "excellent": { "range": "90-100%", "message": "Feedback message", "nextStep": "What to do next" },
        "good": { "range": "70-89%", "message": "Feedback message", "nextStep": "What to focus on" },
        "needsWork": { "range": "Below 70%", "message": "Encouraging message", "nextStep": "Recommended action" }
      },
      "retakeRecommendation": "When and how to retake this quiz"
    }
  ]
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

async function runAgent(
  agentPrompt: string,
  userContext: string,
  agentName: string
): Promise<Record<string, unknown>> {
  console.log(`[Independent Learning] Running ${agentName} agent...`)
  const startTime = Date.now()

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 4096,
      temperature: agentName === 'Analysis' ? 0.3 : 0.7,
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
      console.warn(`[Independent Learning] ${agentName} JSON parse failed, using AI repair...`)
      result = await fixJsonWithAI(text)
      console.log(`[Independent Learning] ${agentName} JSON repaired via AI`)
    }

    console.log(`[Independent Learning] ${agentName} agent completed in ${Date.now() - startTime}ms`)
    return result
  } catch (error) {
    console.error(`[Independent Learning] ${agentName} agent error:`, error)
    throw error
  }
}

function buildRawTextContext(
  extractedText: string,
  childName: string,
  grade: number,
  subject: string,
  schoolType: string,
  languageInstruction: string
): string {
  return `
${languageInstruction}

=== STUDENT INFORMATION ===
Name: ${childName || 'Schüler'}
Grade/Class: ${grade}
School Type: ${schoolType || 'Unknown'}
Subject: ${subject || 'Unknown'}

=== RAW TEST TEXT (OCR Extracted) ===
${extractedText}

=== INSTRUCTIONS ===
Analyze the above test text independently. Identify ALL weaknesses, errors, teacher feedback, and knowledge gaps.
Focus on finding the ROOT CAUSES behind each mistake, not just surface-level errors.
Your analysis should be thorough enough to generate targeted learning materials.
`
}

function buildLearningContext(
  analysis: Record<string, unknown>,
  curriculumTopics: CurriculumTopic[],
  childName: string,
  languageInstruction: string
): string {
  const curriculumContext = curriculumTopics.map(topic => `
- ${topic.name} (${topic.nameEn})
  Key skills: ${topic.keyCompetencies.join(', ')}
  Common mistakes: ${topic.commonMistakes.join(', ')}
  Real-world uses: ${topic.realWorldApplications.join(', ')}
`).join('\n')

  return `
${languageInstruction}

=== INDEPENDENT ANALYSIS RESULTS ===
${JSON.stringify(analysis, null, 2)}

=== RELEVANT CURRICULUM TOPICS (German Lehrplan) ===
${curriculumContext || 'No specific curriculum data available'}

=== STUDENT ===
Name: ${childName || 'Schüler'}

=== INSTRUCTIONS ===
Based on the independent analysis above, create learning content that DIRECTLY addresses the identified weaknesses.
Prioritize the most critical weaknesses first.
Align content with the curriculum topics listed above.
`
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
    console.log('[Independent Learning API] Starting independent analysis for:', childName, 'language:', language)
    const overallStart = Date.now()

    // ============================================
    // STEP 1: Independent Analysis (runs first)
    // ============================================
    const rawTextContext = buildRawTextContext(
      extractedText,
      childName || 'Schüler',
      grade || 5,
      subject || 'Unknown',
      schoolType || 'Unknown',
      languageInstruction
    )

    const analysisResult = await runAgent(
      ANALYSIS_AGENT_PROMPT,
      rawTextContext,
      'Analysis'
    )

    const independentAnalysis = (analysisResult as any).independentAnalysis || analysisResult
    console.log('[Independent Learning API] Found', independentAnalysis.detectedWeaknesses?.length || 0, 'weaknesses independently')

    // ============================================
    // STEP 2: Find curriculum topics from weaknesses
    // ============================================
    const detectedSubject = independentAnalysis.subject || subject || 'Mathematik'
    const detectedGrade = parseInt(String(independentAnalysis.gradeLevel || grade || '5').replace(/\D/g, '')) || 5

    const weaknessTexts: string[] = (independentAnalysis.detectedWeaknesses || []).map(
      (w: any) => w.title || w.description || ''
    ).filter(Boolean)

    const curriculumTopics = findRelevantTopics(detectedSubject, detectedGrade, weaknessTexts)

    // Add prerequisite topics for deeper coverage
    const allTopics = [...curriculumTopics]
    for (const topic of curriculumTopics) {
      const prereqs = getPrerequisites(detectedSubject, topic.id)
      for (const prereq of prereqs) {
        if (!allTopics.find(t => t.id === prereq.id)) {
          allTopics.push(prereq)
        }
      }
    }

    console.log('[Independent Learning API] Matched', allTopics.length, 'curriculum topics')

    // ============================================
    // STEP 3: Generate learning materials in parallel
    // ============================================
    const learningContext = buildLearningContext(
      independentAnalysis,
      allTopics,
      childName || 'Schüler',
      languageInstruction
    )

    const agentPromises: Promise<{ type: string; result: Record<string, unknown> }>[] = []

    if (contentTypes.includes('lessons')) {
      agentPromises.push(
        runAgent(LESSON_GENERATOR_PROMPT, learningContext, 'Lesson')
          .then(result => ({ type: 'lessons', result }))
      )
    }

    if (contentTypes.includes('worksheets')) {
      agentPromises.push(
        runAgent(WORKSHEET_GENERATOR_PROMPT, learningContext, 'Worksheet')
          .then(result => ({ type: 'worksheets', result }))
      )
    }

    if (contentTypes.includes('quizzes')) {
      agentPromises.push(
        runAgent(QUIZ_GENERATOR_PROMPT, learningContext, 'Quiz')
          .then(result => ({ type: 'quizzes', result }))
      )
    }

    // Wait for all content generators to complete
    const agentResults = await Promise.all(agentPromises)

    // ============================================
    // STEP 4: Combine results
    // ============================================
    const learningMaterial: Record<string, unknown> = {
      independentAnalysis,
      curriculumTopics: allTopics.map(t => ({
        id: t.id,
        name: t.name,
        nameEn: t.nameEn,
        keyCompetencies: t.keyCompetencies,
        commonMistakes: t.commonMistakes,
      })),
    }

    for (const { type, result } of agentResults) {
      learningMaterial[type] = result
    }

    const totalTime = Date.now() - overallStart
    console.log(`[Independent Learning API] Complete in ${totalTime}ms. Generated: ${contentTypes.join(', ')}`)

    return NextResponse.json({
      success: true,
      ...learningMaterial,
      metadata: {
        studentName: childName,
        subject: detectedSubject,
        gradeLevel: detectedGrade,
        schoolType,
        generatedAt: new Date().toISOString(),
        contentTypes,
        totalGenerationTime: `${(totalTime / 1000).toFixed(1)}s`,
        isIndependent: true,
        weaknessesFound: independentAnalysis.detectedWeaknesses?.length || 0,
        curriculumTopicsMatched: allTopics.length,
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
