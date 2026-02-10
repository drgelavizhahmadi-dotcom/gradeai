import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'

export const maxDuration = 300

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const FAIRNESS_PROMPT = `You are an expert educational assessor and former teacher with deep knowledge of grading standards, educational fairness, and student rights.

Your task is to analyze a student's test and determine if the grading was fair and consistent. You must be:
1. OBJECTIVE - Base analysis on evidence only
2. BALANCED - Consider both teacher's and student's perspective
3. CONSTRUCTIVE - Focus on actionable insights
4. THOROUGH - Check all aspects of grading fairness

EVALUATION CRITERIA:
1. Consistency: Same errors graded the same way?
2. Clarity: Were expectations clear?
3. Proportionality: Does punishment fit the mistake?
4. Feedback Quality: Was feedback helpful?
5. Partial Credit: Given where deserved?
6. Bias Indicators: Any signs of unfair treatment?

Output ONLY valid JSON in this exact format:
{
  "fairnessScore": 85,
  "verdict": "fair|mostly_fair|questionable|needs_review|cannot_assess",
  "verdictExplanation": "One sentence summary of the verdict",
  "analysis": {
    "consistency": {
      "score": 90,
      "findings": "What we found about grading consistency",
      "examples": ["Specific example 1", "Specific example 2"]
    },
    "clarity": {
      "score": 80,
      "findings": "Were instructions and expectations clear?"
    },
    "proportionality": {
      "score": 85,
      "findings": "Were point deductions proportional to errors?"
    },
    "feedbackQuality": {
      "score": 75,
      "findings": "Was teacher feedback constructive and helpful?"
    },
    "partialCredit": {
      "score": 90,
      "findings": "Was partial credit given where appropriate?"
    }
  },
  "positiveAspects": [
    "What the teacher did well in grading"
  ],
  "concerns": [
    {
      "issue": "Specific concern",
      "severity": "minor|moderate|significant",
      "evidence": "What shows this",
      "impact": "How many points potentially affected"
    }
  ],
  "recommendation": {
    "shouldDiscussWithTeacher": true,
    "urgency": "low|medium|high",
    "reason": "Why or why not to discuss",
    "suggestedApproach": "How to approach the conversation",
    "questionsToAsk": ["Question 1", "Question 2"],
    "whatToAvoid": ["Don't do this", "Avoid saying that"]
  },
  "potentialPointsRecoverable": "0-5 points",
  "confidenceLevel": "high|medium|low",
  "disclaimer": "Standard disclaimer about limitations"
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

    // Extract context for fairness analysis
    const context = {
      student: analysisData.student || { name: childName || 'Student' },
      test: analysisData.test || {},
      grade: analysisData.grade || {},
      teacherFeedback: analysisData.teacherFeedback || {},
      weaknesses: analysisData.weaknesses || [],
      strengths: analysisData.strengths || [],
      errorAnalysis: analysisData.errorAnalysis || {},
      extractedText: analysisData.extractedText || '',
    }

    const userPrompt = `Analyze the fairness of this student's test grading:

STUDENT: ${context.student.name || childName || 'Student'}
CLASS: ${context.student.class || 'Unknown'}
SUBJECT: ${context.test.subject || 'Unknown'}
TOPIC: ${context.test.topic || 'Unknown'}
DATE: ${context.test.date || 'Unknown'}

GRADE RECEIVED:
- Grade: ${context.grade.value || 'Unknown'}
- Points: ${context.grade.points || 'Unknown'}
- Max Points: ${context.test.maxPoints || 'Unknown'}
- Percentage: ${context.grade.percentage || 'Unknown'}%

TEACHER FEEDBACK:
Main Comment: ${context.teacherFeedback.mainComment || 'None visible'}
Tone: ${context.teacherFeedback.overallTone || 'Unknown'}
Margin Notes: ${JSON.stringify(context.teacherFeedback.marginNotes || [])}

IDENTIFIED STRENGTHS:
${JSON.stringify(context.strengths, null, 2)}

IDENTIFIED WEAKNESSES/ERRORS:
${JSON.stringify(context.weaknesses, null, 2)}

ERROR DETAILS:
${JSON.stringify(context.errorAnalysis, null, 2)}

Provide your fairness analysis in ${targetLanguage === 'de' ? 'GERMAN' : targetLanguage.toUpperCase()} language.

Be thorough but fair to both the teacher and student. Remember that teachers are professionals doing their best, but students also deserve fair treatment.`

    console.log('[Fairness API] Analyzing fairness for:', context.student.name)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3, // Lower for more consistent analysis
      system: FAIRNESS_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    if (!textBlock) {
      throw new Error('No text content in response')
    }

    // Parse JSON response
    let fairnessData
    try {
      const jsonMatch = textBlock.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                        textBlock.text.match(/```\n?([\s\S]*?)\n?```/)
      const jsonString = jsonMatch ? jsonMatch[1] : textBlock.text
      fairnessData = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('[Fairness API] Parse error:', parseError)
      return NextResponse.json({ error: 'Failed to parse fairness data' }, { status: 500 })
    }

    console.log('[Fairness API] Analysis complete. Score:', fairnessData.fairnessScore)

    return NextResponse.json({
      success: true,
      ...fairnessData,
      generatedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Fairness API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze fairness', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
