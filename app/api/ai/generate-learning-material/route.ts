import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'
import { findRelevantTopics, getPrerequisites, CurriculumTopic } from '@/lib/curriculum/german-lehrplan'

export const maxDuration = 300

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// === AGENT PROMPTS (Multi-Agent Orchestrator Pattern) ===

const LESSON_AGENT_PROMPT = `You are a master teacher creating personalized learning lessons for German school students.

Your role: Create clear, engaging EXPLANATIONS that teach concepts the student struggled with.

RULES:
- Write in the student's language (usually German)
- Use age-appropriate examples and analogies
- Break complex concepts into digestible chunks
- Include visual descriptions (diagrams, number lines, etc.)
- Reference real-world applications
- Build from prerequisites to the main concept
- Maximum 3 lessons, each focused on ONE specific weakness

Output ONLY valid JSON:
{
  "lessons": [
    {
      "title": "Lesson title",
      "targetWeakness": "The specific weakness this addresses",
      "prerequisiteCheck": "Quick question to check if student has foundation",
      "explanation": "Clear, step-by-step explanation (use markdown for formatting)",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "exampleWalkthrough": {
        "problem": "Example problem",
        "steps": ["Step 1", "Step 2", "Step 3"],
        "solution": "Final answer with explanation"
      },
      "memoryTrick": "Mnemonic or memory aid",
      "realWorldConnection": "How this applies to daily life"
    }
  ]
}`

const WORKSHEET_AGENT_PROMPT = `You are an educational worksheet designer creating practice exercises for German school students.

Your role: Create PRACTICE WORKSHEETS with graduated difficulty for targeted skill building.

RULES:
- Start with easier problems, gradually increase difficulty
- Include a mix of problem types
- Focus specifically on the identified weaknesses
- Provide clear instructions in German
- Include answer key at the end
- 8-12 problems total per worksheet
- Create 2-3 worksheets for different skill levels

Output ONLY valid JSON:
{
  "worksheets": [
    {
      "title": "Worksheet title",
      "targetWeakness": "The specific weakness this practices",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": "15-20 Minuten",
      "instructions": "Clear instructions in German",
      "problems": [
        {
          "number": 1,
          "type": "multiple_choice|fill_blank|short_answer|calculation|matching",
          "question": "The problem/question",
          "options": ["A", "B", "C", "D"] or null,
          "hint": "Optional hint for struggling students",
          "points": 2
        }
      ],
      "answerKey": [
        {
          "number": 1,
          "answer": "Correct answer",
          "explanation": "Brief explanation of why"
        }
      ],
      "bonusChallenge": {
        "question": "Extra challenge for fast learners",
        "answer": "Answer"
      }
    }
  ]
}`

const QUIZ_AGENT_PROMPT = `You are an assessment specialist creating diagnostic quizzes for German school students.

Your role: Create SHORT QUIZZES to assess understanding and identify remaining gaps.

RULES:
- 5-7 questions per quiz
- Mix of difficulty levels
- Test conceptual understanding, not just memorization
- Include questions that reveal common misconceptions
- Provide diagnostic feedback for each answer
- Align with German school curriculum standards

Output ONLY valid JSON:
{
  "quizzes": [
    {
      "title": "Quiz title",
      "targetTopic": "The main topic being assessed",
      "timeLimit": "10 Minuten",
      "passingScore": 70,
      "questions": [
        {
          "number": 1,
          "question": "The question",
          "type": "multiple_choice|true_false|short_answer",
          "options": ["A", "B", "C", "D"] or null,
          "correctAnswer": "The correct answer",
          "points": 2,
          "commonMistake": "What students often get wrong",
          "feedbackIfWrong": "Helpful feedback if they get it wrong",
          "feedbackIfCorrect": "Reinforcement if they get it right"
        }
      ],
      "scoringGuide": {
        "excellent": "90-100%: Message",
        "good": "70-89%: Message",
        "needsWork": "Below 70%: Message"
      }
    }
  ]
}`

const ORCHESTRATOR_PROMPT = `You are the master orchestrator for a personalized learning system.

Your role: Analyze student weaknesses and teacher feedback to create a LEARNING PLAN.

Given the student's test results, weaknesses, and curriculum context:
1. Prioritize which weaknesses to address first
2. Identify prerequisite gaps
3. Create a recommended learning sequence

Output ONLY valid JSON:
{
  "analysis": {
    "primaryWeaknesses": ["Most critical weakness 1", "Weakness 2"],
    "prerequisiteGaps": ["Any foundational concepts missing"],
    "recommendedSequence": ["Step 1: topic", "Step 2: topic", "Step 3: topic"],
    "estimatedLearningTime": "2-3 Stunden",
    "difficultyLevel": "beginner|intermediate|advanced"
  },
  "learningPath": {
    "immediate": "What to work on right now",
    "shortTerm": "Goals for this week",
    "longTerm": "Goals for this month"
  }
}`

// === Helper Functions ===

async function runAgent(
  agentPrompt: string,
  userContext: string,
  agentName: string
): Promise<Record<string, unknown>> {
  console.log(`[Learning Material] Running ${agentName} agent...`)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      system: agentPrompt,
      messages: [{ role: 'user', content: userContext }],
    })

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    if (!textBlock) {
      throw new Error(`No text content from ${agentName} agent`)
    }

    // Parse JSON response
    const jsonMatch = textBlock.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      textBlock.text.match(/```\n?([\s\S]*?)\n?```/)
    const jsonString = jsonMatch ? jsonMatch[1] : textBlock.text

    return JSON.parse(jsonString.trim())
  } catch (error) {
    console.error(`[Learning Material] ${agentName} agent error:`, error)
    throw error
  }
}

function buildStudentContext(
  analysisData: Record<string, unknown>,
  childName: string,
  curriculumTopics: CurriculumTopic[],
  targetLanguage: string
): string {
  const studentData = analysisData.student as Record<string, unknown> | undefined
  const testData = analysisData.test as Record<string, unknown> | undefined
  const gradeData = analysisData.grade as Record<string, unknown> | undefined

  const student = studentData || { name: childName || 'Schüler' }
  const test = testData || {}
  const weaknesses = analysisData.weaknesses || []
  const teacherFeedback = analysisData.teacherFeedback || analysisData.feedback || ''
  const recommendations = analysisData.recommendations || []
  const grade = gradeData || {}

  // Format curriculum context
  const curriculumContext = curriculumTopics.map(topic => `
- ${topic.name} (${topic.nameEn})
  Key skills: ${topic.keyCompetencies.join(', ')}
  Common mistakes: ${topic.commonMistakes.join(', ')}
  Prerequisites: ${topic.prerequisites.join(', ') || 'None'}
  Real-world uses: ${topic.realWorldApplications.join(', ')}
`).join('\n')

  return `
=== STUDENT PROFILE ===
Name: ${(student as Record<string, unknown>).name || childName || 'Schüler'}
Class/Grade: ${(student as Record<string, unknown>).class || 'Unknown'}
Subject: ${(test as Record<string, unknown>).subject || 'Unknown'}
Test Topic: ${(test as Record<string, unknown>).topic || 'Unknown'}
Test Grade: ${(grade as Record<string, unknown>).value || 'Unknown'} (${(grade as Record<string, unknown>).points || 'Unknown'} points)

=== IDENTIFIED WEAKNESSES ===
${JSON.stringify(weaknesses, null, 2)}

=== TEACHER FEEDBACK ===
${teacherFeedback || 'No specific teacher feedback provided'}

=== RECOMMENDATIONS FROM ANALYSIS ===
${JSON.stringify(recommendations, null, 2)}

=== RELEVANT CURRICULUM TOPICS (German Lehrplan) ===
${curriculumContext || 'No specific curriculum data available'}

=== INSTRUCTIONS ===
Generate learning content in ${targetLanguage === 'de' ? 'GERMAN' : targetLanguage.toUpperCase()} language.
Focus specifically on the weaknesses identified above.
Make content age-appropriate for the student's grade level.
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
      analysisData,
      childName,
      targetLanguage = 'de',
      contentTypes = ['lessons', 'worksheets', 'quizzes'] // What to generate
    } = await request.json()

    if (!analysisData) {
      return NextResponse.json({ error: 'Missing analysis data' }, { status: 400 })
    }

    console.log('[Learning Material API] Starting generation for:', childName)

    // Extract subject and grade for curriculum lookup
    const studentData = analysisData.student as Record<string, unknown> | undefined
    const testData = analysisData.test as Record<string, unknown> | undefined

    const subject = (testData?.subject as string) || 'Mathematik'
    const gradeLevel = parseInt(String((studentData?.class as string) || '5').replace(/\D/g, '')) || 5

    // Extract weakness texts for curriculum matching
    const weaknessTexts: string[] = []
    const weaknesses = analysisData.weaknesses as Array<Record<string, unknown>> | undefined
    if (Array.isArray(weaknesses)) {
      weaknesses.forEach((w: Record<string, unknown>) => {
        const text = (w.title as string) || (w.description as string) || (w.point as string) || ''
        if (text) weaknessTexts.push(text)
      })
    }

    // Find relevant curriculum topics
    const curriculumTopics = findRelevantTopics(subject, gradeLevel, weaknessTexts)

    // Add prerequisite topics
    const allTopics = [...curriculumTopics]
    for (const topic of curriculumTopics) {
      const prereqs = getPrerequisites(subject, topic.id)
      for (const prereq of prereqs) {
        if (!allTopics.find(t => t.id === prereq.id)) {
          allTopics.push(prereq)
        }
      }
    }

    console.log('[Learning Material API] Found', allTopics.length, 'relevant curriculum topics')

    // Build context for all agents
    const studentContext = buildStudentContext(analysisData, childName, allTopics, targetLanguage)

    // Run orchestrator first to get learning plan
    const orchestratorResult = await runAgent(
      ORCHESTRATOR_PROMPT,
      studentContext,
      'Orchestrator'
    )

    // Run content agents in parallel based on requested types
    const agentPromises: Promise<{ type: string; result: Record<string, unknown> }>[] = []

    if (contentTypes.includes('lessons')) {
      agentPromises.push(
        runAgent(LESSON_AGENT_PROMPT, studentContext, 'Lesson')
          .then(result => ({ type: 'lessons', result }))
      )
    }

    if (contentTypes.includes('worksheets')) {
      agentPromises.push(
        runAgent(WORKSHEET_AGENT_PROMPT, studentContext, 'Worksheet')
          .then(result => ({ type: 'worksheets', result }))
      )
    }

    if (contentTypes.includes('quizzes')) {
      agentPromises.push(
        runAgent(QUIZ_AGENT_PROMPT, studentContext, 'Quiz')
          .then(result => ({ type: 'quizzes', result }))
      )
    }

    // Wait for all agents to complete
    const agentResults = await Promise.all(agentPromises)

    // Combine results
    const learningMaterial: Record<string, unknown> = {
      learningPlan: orchestratorResult,
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

    console.log('[Learning Material API] Successfully generated learning material')

    return NextResponse.json({
      success: true,
      ...learningMaterial,
      metadata: {
        studentName: childName,
        subject,
        gradeLevel,
        generatedAt: new Date().toISOString(),
        contentTypes,
      }
    })

  } catch (error) {
    console.error('[Learning Material API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate learning material',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
