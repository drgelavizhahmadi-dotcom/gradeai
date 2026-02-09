import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// === STEP 1: Independent Test Reconstruction Agent ===
// Reads raw OCR text and reconstructs what the test looked like, what the student wrote,
// and how the teacher graded it - completely independent from the main analysis pipeline.

const TEST_RECONSTRUCTION_PROMPT = `You are an expert at analyzing scanned school test documents. You receive raw OCR-extracted text from a German school test and must reconstruct:

1. The original test questions and their point values
2. What the student wrote as answers
3. How the teacher marked/corrected each answer
4. Point deductions and their reasons
5. Teacher comments (margin notes, final comments, correction symbols)
6. The final grade and total points

You work INDEPENDENTLY - you only have the raw text. Be meticulous and forensic in your analysis.

RULES:
- Distinguish between printed test questions and handwritten student answers
- Identify teacher correction marks (checkmarks, crosses, circles, underlines, etc.)
- Note partial credit given or denied
- Record ALL teacher comments, even small margin notes
- Calculate point totals yourself to verify the teacher's math
- Write your analysis in GERMAN

Output ONLY valid JSON:
{
  "testReconstruction": {
    "subject": "Detected subject",
    "topic": "Main test topic",
    "testType": "Klassenarbeit|Test|Quiz|Probe|Schulaufgabe",
    "maxPoints": 0,
    "achievedPoints": 0,
    "calculatedPercentage": 0,
    "gradeGiven": "The grade the teacher gave",
    "questions": [
      {
        "number": 1,
        "questionText": "What was asked",
        "maxPoints": 5,
        "studentAnswer": "What the student wrote",
        "pointsGiven": 3,
        "teacherMarks": "What marks/corrections the teacher made",
        "isCorrect": false,
        "isPartiallyCorrect": true,
        "deductionReason": "Why points were deducted"
      }
    ],
    "teacherComments": {
      "finalComment": "Teacher's final comment if any",
      "marginNotes": ["Note 1", "Note 2"],
      "correctionSymbols": ["Symbol and meaning"],
      "overallTone": "encouraging|neutral|critical|mixed"
    },
    "pointCalculationCheck": {
      "teacherTotal": 0,
      "myCalculatedTotal": 0,
      "discrepancy": false,
      "discrepancyDetails": "If points don't add up, explain"
    }
  }
}`

// === STEP 2: Independent Fairness Analysis Agent ===
// Takes the reconstructed test and performs a thorough fairness evaluation

const FAIRNESS_ANALYSIS_PROMPT = `You are an independent educational fairness auditor with expertise in German school grading standards (Notengebung), educational law, and student rights.

You receive a detailed reconstruction of a student's test. Your job is to perform a THOROUGH, INDEPENDENT fairness analysis.

EVALUATION DIMENSIONS:
1. **Grading Consistency**: Are similar errors penalized the same way throughout?
2. **Point Proportionality**: Are deductions proportional to the severity of errors?
3. **Partial Credit Fairness**: Is partial credit given where the student showed understanding?
4. **Clarity of Expectations**: Were questions clear and unambiguous?
5. **Feedback Quality**: Is teacher feedback constructive and helpful?
6. **Mathematical Accuracy**: Do the points add up correctly?
7. **Grade Threshold Fairness**: Is the student near a grade boundary? Could recovered points change the grade?
8. **Comparison with Standards**: Does grading align with typical German school standards?

RULES:
- Be OBJECTIVE - base everything on evidence
- Be FAIR to both teacher and student
- Identify specific examples for every claim
- Calculate potential point recovery
- Consider the German grading system (1-6, Notenspiegel)
- Provide actionable recommendations
- Write in GERMAN

Output ONLY valid JSON:
{
  "fairnessAnalysis": {
    "overallScore": 85,
    "verdict": "fair|mostly_fair|some_concerns|questionable|needs_review",
    "verdictSummary": "One sentence summary",
    "dimensions": {
      "gradingConsistency": {
        "score": 90,
        "finding": "What we found",
        "examples": ["Specific example from the test"],
        "concern": null
      },
      "pointProportionality": {
        "score": 80,
        "finding": "Assessment of point deductions",
        "examples": ["Example"],
        "concern": "Any concern or null"
      },
      "partialCredit": {
        "score": 85,
        "finding": "How partial credit was handled",
        "examples": ["Example"],
        "concern": null
      },
      "clarityOfExpectations": {
        "score": 90,
        "finding": "Were questions clear?",
        "examples": [],
        "concern": null
      },
      "feedbackQuality": {
        "score": 75,
        "finding": "Quality of teacher feedback",
        "examples": [],
        "concern": "Any concern"
      },
      "mathematicalAccuracy": {
        "score": 100,
        "finding": "Do the points add up?",
        "examples": [],
        "concern": null
      }
    },
    "positiveFindings": [
      {
        "title": "What the teacher did well",
        "detail": "Specific evidence"
      }
    ],
    "concerns": [
      {
        "title": "Specific concern title",
        "severity": "minor|moderate|significant|critical",
        "detail": "What we found",
        "evidence": "Specific reference from the test",
        "pointsAffected": "0-3 points",
        "recommendation": "What should be done"
      }
    ],
    "gradeBoundaryAnalysis": {
      "currentGrade": "3",
      "currentPoints": 25,
      "maxPoints": 40,
      "percentage": 62.5,
      "nextBetterGrade": "2",
      "pointsNeededForBetter": 5,
      "potentialRecoverablePoints": 3,
      "couldChangeGrade": false,
      "analysis": "Detailed boundary analysis"
    },
    "pointRecoveryOpportunities": [
      {
        "question": "Question 3",
        "currentPoints": 2,
        "possiblePoints": 4,
        "argument": "Why more points could be justified",
        "strength": "strong|moderate|weak"
      }
    ],
    "totalPotentialRecovery": "3-5 Punkte",
    "recommendation": {
      "shouldContactTeacher": true,
      "urgency": "low|medium|high",
      "approach": "How to approach the conversation",
      "specificPoints": ["Point 1 to discuss", "Point 2"],
      "whatToAvoid": ["Don't do this"],
      "sampleOpener": "A suggested opening sentence for the conversation"
    },
    "disclaimer": "Standard disclaimer about limitations of analysis from OCR text"
  }
}`

// === Helper ===

function extractJson(raw: string): string {
  let s = raw.trim()

  // Try to extract from code fences first
  const jsonMatch = s.match(/```json\n?([\s\S]*?)\n?```/) ||
                    s.match(/```\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    s = jsonMatch[1].trim()
  }

  // Find the outermost JSON object
  const firstBrace = s.indexOf('{')
  const lastBrace = s.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1)
  }

  // Fix trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1')

  return s
}

async function fixJsonWithAI(brokenJson: string): Promise<Record<string, unknown>> {
  console.log('[Independent Fairness] Using AI to fix broken JSON...')
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0,
    system: 'You are a JSON repair tool. You receive broken or malformed JSON and output ONLY the repaired, valid JSON. Fix any syntax errors (unescaped quotes, missing commas, trailing commas, unescaped newlines in strings, etc). Output NOTHING except the valid JSON object.',
    messages: [{ role: 'user', content: `Fix this broken JSON and output ONLY valid JSON:\n\n${brokenJson}` }],
  })

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
  if (!textBlock) throw new Error('No response from JSON repair')

  const cleaned = extractJson(textBlock.text)
  return JSON.parse(cleaned)
}

async function runAgent(
  agentPrompt: string,
  userContext: string,
  agentName: string,
  temperature: number = 0.3
): Promise<Record<string, unknown>> {
  console.log(`[Independent Fairness] Running ${agentName} agent...`)
  const startTime = Date.now()

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature,
      system: agentPrompt,
      messages: [{ role: 'user', content: userContext }],
    })

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    if (!textBlock) {
      throw new Error(`No text content from ${agentName} agent`)
    }

    const jsonString = extractJson(textBlock.text)

    // Try parsing directly first, then use AI to repair
    let result: Record<string, unknown>
    try {
      result = JSON.parse(jsonString)
    } catch (parseError) {
      console.warn(`[Independent Fairness] ${agentName} JSON parse failed, using AI repair...`)
      result = await fixJsonWithAI(textBlock.text)
      console.log(`[Independent Fairness] ${agentName} JSON repaired via AI`)
    }

    console.log(`[Independent Fairness] ${agentName} agent completed in ${Date.now() - startTime}ms`)
    return result
  } catch (error) {
    console.error(`[Independent Fairness] ${agentName} agent error:`, error)
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
    } = await request.json()

    if (!extractedText) {
      return NextResponse.json({ error: 'Missing extracted text' }, { status: 400 })
    }

    console.log('[Independent Fairness API] Starting independent fairness analysis for:', childName)
    const overallStart = Date.now()

    // ============================================
    // STEP 1: Reconstruct the test from raw text
    // ============================================
    const reconstructionContext = `
=== STUDENT INFORMATION ===
Name: ${childName || 'Schüler'}
Grade/Class: ${grade || 'Unknown'}
School Type: ${schoolType || 'Unknown'}
Subject: ${subject || 'Unknown'}

=== RAW TEST TEXT (OCR Extracted) ===
${extractedText}

=== INSTRUCTIONS ===
Reconstruct this test in detail. Identify every question, student answer, teacher correction, and point value.
Be forensic - look for correction marks, margin notes, crossed-out text, and anything that indicates grading decisions.
Verify the point calculation yourself.
Write your analysis in GERMAN.
`

    const reconstructionResult = await runAgent(
      TEST_RECONSTRUCTION_PROMPT,
      reconstructionContext,
      'TestReconstruction',
      0.2 // Very low temperature for accuracy
    )

    const testReconstruction = (reconstructionResult as any).testReconstruction || reconstructionResult
    console.log('[Independent Fairness API] Test reconstructed:', testReconstruction.questions?.length || 0, 'questions found')

    // ============================================
    // STEP 2: Run fairness analysis on reconstruction
    // ============================================
    const fairnessContext = `
=== RECONSTRUCTED TEST ===
${JSON.stringify(testReconstruction, null, 2)}

=== STUDENT CONTEXT ===
Name: ${childName || 'Schüler'}
Grade/Class: ${grade || 'Unknown'}
School Type: ${schoolType || 'Unknown'}
Subject: ${subject || 'Unknown'}

=== INSTRUCTIONS ===
Perform a thorough, independent fairness analysis of this test grading.
Check every dimension: consistency, proportionality, partial credit, clarity, feedback quality, mathematical accuracy.
Be objective and evidence-based. Reference specific questions and point deductions.
Calculate if recovering points could change the grade.
Write your analysis in GERMAN.
`

    const fairnessResult = await runAgent(
      FAIRNESS_ANALYSIS_PROMPT,
      fairnessContext,
      'FairnessAnalysis',
      0.3
    )

    const fairnessAnalysis = (fairnessResult as any).fairnessAnalysis || fairnessResult

    const totalTime = Date.now() - overallStart
    console.log(`[Independent Fairness API] Complete in ${totalTime}ms. Score: ${fairnessAnalysis.overallScore}`)

    return NextResponse.json({
      success: true,
      testReconstruction,
      fairnessAnalysis,
      metadata: {
        studentName: childName,
        subject: testReconstruction.subject || subject,
        generatedAt: new Date().toISOString(),
        totalGenerationTime: `${(totalTime / 1000).toFixed(1)}s`,
        isIndependent: true,
        questionsAnalyzed: testReconstruction.questions?.length || 0,
        concernsFound: fairnessAnalysis.concerns?.length || 0,
      }
    })

  } catch (error) {
    console.error('[Independent Fairness API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform independent fairness analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
