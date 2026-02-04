import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const FLASHCARD_PROMPT = `You are an expert educational content creator specializing in creating effective learning flashcards for students.

Based on the test analysis provided, create personalized flashcards that:
1. Target the SPECIFIC weaknesses identified in the test
2. Use age-appropriate language for the student's grade level
3. Include memory tricks and mnemonics where helpful
4. Cover the exact topics from the test

IMPORTANT RULES:
- Create exactly 8-10 flashcards
- Each flashcard should address a specific weakness or knowledge gap
- Front: Clear question or concept to recall
- Back: Concise, memorable answer
- Tip: A memory trick, mnemonic, or study hint
- Make them SPECIFIC to the test content, not generic

Output ONLY valid JSON in this exact format:
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { analysisData, childName, targetLanguage = 'de' } = await request.json()

    if (!analysisData) {
      return NextResponse.json({ error: 'Missing analysis data' }, { status: 400 })
    }

    // Extract relevant context for flashcard generation
    const context = {
      student: analysisData.student || { name: childName || 'Student' },
      test: analysisData.test || {},
      weaknesses: analysisData.weaknesses || [],
      errorAnalysis: analysisData.errorAnalysis || {},
      grade: analysisData.grade || {},
    }

    const userPrompt = `Create flashcards for this student based on their test performance:

STUDENT: ${context.student.name || childName || 'Student'}
SUBJECT: ${context.test.subject || 'Unknown'}
TOPIC: ${context.test.topic || 'Unknown'}
GRADE LEVEL: ${context.student.class || 'Unknown'}

IDENTIFIED WEAKNESSES:
${JSON.stringify(context.weaknesses, null, 2)}

ERROR ANALYSIS:
${JSON.stringify(context.errorAnalysis, null, 2)}

TEST PERFORMANCE:
Grade: ${context.grade.value || 'Unknown'}
Points: ${context.grade.points || 'Unknown'}

Create flashcards in ${targetLanguage === 'de' ? 'GERMAN' : targetLanguage.toUpperCase()} language that specifically address these weaknesses and help the student master the material they struggled with.`

    console.log('[Flashcards API] Generating flashcards for:', context.student.name)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      system: FLASHCARD_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    if (!textBlock) {
      throw new Error('No text content in response')
    }

    // Parse JSON response
    let flashcardData
    try {
      const jsonMatch = textBlock.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                        textBlock.text.match(/```\n?([\s\S]*?)\n?```/)
      const jsonString = jsonMatch ? jsonMatch[1] : textBlock.text
      flashcardData = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('[Flashcards API] Parse error:', parseError)
      return NextResponse.json({ error: 'Failed to parse flashcard data' }, { status: 500 })
    }

    console.log('[Flashcards API] Generated', flashcardData.flashcards?.length || 0, 'flashcards')

    return NextResponse.json({
      success: true,
      ...flashcardData,
      generatedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Flashcards API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate flashcards', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
