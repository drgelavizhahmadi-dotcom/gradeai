import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI: GoogleGenerativeAI | null = null

function initializeGemini() {
  if (genAI) return genAI

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  console.log('[Gemini] Initializing Gemini AI client...')
  genAI = new GoogleGenerativeAI(apiKey)
  return genAI
}

export interface GeminiAnalysis {
  perspective: 'student-work' | 'teacher-notes' | 'visual-structure'
  extractedText: string
  grades: string[]
  mistakes: string[]
  teacherComments: string[]
  confidence: number
  rawResponse: string
}

/**
 * Analyze student handwriting (blue/black ink)
 */
export async function analyzeStudentWork(imageBuffer: Buffer): Promise<GeminiAnalysis> {
  console.log('[Gemini] Analyzing student work...')
  
  const genAI = initializeGemini()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are analyzing a German school test with HANDWRITTEN student answers.

Focus ONLY on blue/black ink (student's handwriting):
1. Extract all student answers and work
2. Identify crossed-out or corrected answers
3. Note any calculations or working shown
4. Identify incomplete answers

Return JSON:
{
  "extractedText": "full text from student work",
  "answers": ["answer 1", "answer 2", ...],
  "corrections": ["what was crossed out/changed"],
  "workShown": ["calculations or working"],
  "confidence": 0.0-1.0
}`

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      },
    },
    { text: prompt },
  ])

  const response = result.response.text()
  console.log('[Gemini] Student work analysis complete')

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
    return {
      perspective: 'student-work',
      extractedText: parsed.extractedText || '',
      grades: [],
      mistakes: parsed.corrections || [],
      teacherComments: [],
      confidence: parsed.confidence || 0.85,
      rawResponse: response,
    }
  } catch (error) {
    console.error('[Gemini] Failed to parse response:', error)
    return {
      perspective: 'student-work',
      extractedText: response,
      grades: [],
      mistakes: [],
      teacherComments: [],
      confidence: 0.5,
      rawResponse: response,
    }
  }
}

/**
 * Analyze teacher notes (red ink)
 */
export async function analyzeTeacherNotes(imageBuffer: Buffer): Promise<GeminiAnalysis> {
  console.log('[Gemini] Analyzing teacher notes...')
  
  const genAI = initializeGemini()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are analyzing a German school test with HANDWRITTEN teacher feedback.

Focus ONLY on RED INK (teacher's marks and comments):

**CRITICAL TASK: FIND THE GRADE**
German grades are 1-6 scale (1=best, 6=worst):
- Formats: 1, 1+, 1-, 2, 2+, 2-, 3, 3+, 3-, 4, 4+, 4-, 5, 5+, 5-, 6
- OR decimals: 1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 4.3, 4.7, 5.0, 5.3, 5.7, 6.0
- Look for: "Note:", "Note =", just the number circled/underlined
- Common locations: top right, bottom, in red circle

Also extract:
1. ALL teacher comments and corrections
2. Checkmarks (✓), X marks (✗)
3. Points: "15/20", "8 von 10 Punkten"
4. Written feedback in red

Return JSON:
{
  "grades": ["EXACT grade text found, e.g., 'Note: 2+', '3-', '1.7'"],
  "comments": ["all teacher comments word-for-word"],
  "corrections": ["what teacher marked wrong"],
  "pointsScored": ["e.g., '15/20', '8/10'"],
  "checkmarks": ["questions marked correct"],
  "confidence": 0.0-1.0
}`

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      },
    },
    { text: prompt },
  ])

  const response = result.response.text()
  console.log('[Gemini] Teacher notes analysis complete')

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
    return {
      perspective: 'teacher-notes',
      extractedText: parsed.comments?.join('\n') || '',
      grades: parsed.grades || [],
      mistakes: parsed.corrections || [],
      teacherComments: parsed.comments || [],
      confidence: parsed.confidence || 0.85,
      rawResponse: response,
    }
  } catch (error) {
    console.error('[Gemini] Failed to parse response:', error)
    return {
      perspective: 'teacher-notes',
      extractedText: response,
      grades: [],
      mistakes: [],
      teacherComments: [],
      confidence: 0.5,
      rawResponse: response,
    }
  }
}

/**
 * Analyze visual structure and context
 */
export async function analyzeVisualStructure(imageBuffer: Buffer): Promise<GeminiAnalysis> {
  console.log('[Gemini] Analyzing visual structure...')
  
  const genAI = initializeGemini()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are analyzing a German school test. You MUST provide a COMPLETE analysis.

**STEP 1: READ EVERYTHING**
Look at the ENTIRE image carefully:
- What subject is this? (Look at header, question types, content)
- How many questions/exercises are there?
- What did the student write?
- What marks did the teacher make? (✓, ✗, circles, corrections in red)

**STEP 2: FIND THE GRADE**
German scale: 1 (excellent) to 6 (failing)
Formats: 1+, 2-, 3, 4.0, 5.3, etc.
Usually in RED, may be circled

**STEP 3: ANALYZE PERFORMANCE**

For STRENGTHS, you MUST list AT LEAST 2-3 items like:
- "Question 1 marked correct with checkmark"
- "Correctly solved the math problem in exercise 2"
- "Good handwriting and organization"
- "Attempted all questions"

For WEAKNESSES, you MUST list AT LEAST 2-3 items like:
- "Question 3 marked incorrect (red X)"
- "Math calculation error in problem 4"
- "Spelling mistakes corrected in red"
- "Missing answer for question 5"

**STEP 4: IDENTIFY SUBJECT**
Based on what you see:
- Math problems = "Mathematik"
- Grammar/reading = "Deutsch"  
- Foreign language = "Englisch" or "Französisch"
- Science diagrams = "Biologie", "Physik", "Chemie"
Make your BEST GUESS - never say "NOT_FOUND"

**EXAMPLE GOOD OUTPUT:**
{
  "grade": "3-",
  "subject": "Mathematik",
  "strengths": ["Question 1 correct", "Good calculation method in Q2", "Neat presentation"],
  "weaknesses": ["Calculation error in Q3", "Wrong formula in Q4", "Did not complete Q5"],
  "teacherComments": ["Besser aufpassen", "Mehr üben"],
  ...
}

**EXAMPLE BAD OUTPUT (DO NOT DO THIS):**
{
  "strengths": [],  ❌ NEVER EMPTY
  "weaknesses": [], ❌ NEVER EMPTY
  "subject": "NOT_FOUND" ❌ ALWAYS GUESS
}

NOW ANALYZE THIS TEST:

Return JSON:
{
  "grade": "exact grade or 'Unknown'",
  "gradeLocation": "where found",
  "subject": "Mathematik/Deutsch/Englisch/etc - MUST GUESS, never NOT_FOUND",
  "teacherComments": ["teacher's red ink comments"],
  "strengths": ["MINIMUM 2 items - what student did right"],
  "weaknesses": ["MINIMUM 2 items - what student did wrong"],
  "totalPoints": "e.g. 15/20",
  "questionsCount": number,
  "visualMarks": ["describe ALL marks you see"],
  "confidence": 0.0-1.0
}`

  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg',
      },
    },
    { text: prompt },
  ])

  const response = result.response.text()
  console.log('[Gemini] Visual structure analysis complete')
  console.log('[Gemini] Raw response:', response.substring(0, 500))

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
    console.log('[Gemini] Parsed successfully:', JSON.stringify(parsed, null, 2))
    
    return {
      perspective: 'visual-structure',
      extractedText: parsed.subject || '',
      grades: parsed.grade && parsed.grade !== 'NOT_FOUND' ? [parsed.grade] : [],
      mistakes: parsed.weaknesses || [],
      teacherComments: parsed.teacherComments || [],
      confidence: parsed.confidence || 0.85,
      rawResponse: response,
    }
  } catch (error) {
    console.error('[Gemini] Failed to parse response:', error)
    console.error('[Gemini] Full response:', response)
    return {
      perspective: 'visual-structure',
      extractedText: response,
      grades: [],
      mistakes: [],
      teacherComments: [],
      confidence: 0.5,
      rawResponse: response,
    }
  }
}

/**
 * Synthesize all analyses into final report
 */
export async function synthesizeAnalyses(
  studentWork: GeminiAnalysis,
  teacherNotes: GeminiAnalysis,
  visualStructure: GeminiAnalysis
): Promise<{
  finalGrade: string
  subject: string
  strengths: string[]
  weaknesses: string[]
  teacherFeedback: string
  recommendations: string[]
  confidence: number
  expertAgreement: string
}> {
  console.log('[Gemini] Synthesizing analyses...')
  
  const genAI = initializeGemini()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are synthesizing 3 expert analyses of a German school test.

EXPERT 1 (Student Work Analysis):
${JSON.stringify(studentWork, null, 2)}

EXPERT 2 (Teacher Notes Analysis - RED INK):
${JSON.stringify(teacherNotes, null, 2)}

EXPERT 3 (Visual Structure Analysis):
${JSON.stringify(visualStructure, null, 2)}

**CRITICAL: EXTRACT THE GRADE**
Priority order for grade:
1. Expert 2 (teacher notes in red) - most reliable
2. Expert 3 (visual structure) - second choice
3. Expert 1 (student work) - least reliable

German grading scale:
- 1 (sehr gut) = excellent
- 2 (gut) = good  
- 3 (befriedigend) = satisfactory
- 4 (ausreichend) = sufficient
- 5 (mangelhaft) = poor/failing
- 6 (ungenügend) = insufficient/failing

Grades can have +/- or decimals (e.g., 2+, 3-, 1.7, 2.3)

**CREATE PARENT-FRIENDLY REPORT IN GERMAN/ENGLISH:**

Return JSON:
{
  "finalGrade": "EXACT grade found (e.g., '2+', '3-', '1.7') - if NOT found, analyze point system and estimate",
  "gradeSource": "which expert found it or 'ESTIMATED'",
  "subject": "test subject in German (e.g., 'Mathematik', 'Deutsch', 'Englisch')",
  "strengths": ["3-5 specific things student did well"],
  "weaknesses": ["3-5 specific areas for improvement based on teacher corrections"],
  "teacherFeedback": "2-3 sentence summary of ALL teacher comments in plain German/English",
  "recommendations": ["3-5 specific, actionable steps parents can take"],
  "confidence": 0.0-1.0,
  "expertAgreement": "brief note on agreement between experts"
}`

  const result = await model.generateContent(prompt)
  const response = result.response.text()
  console.log('[Gemini] Synthesis complete')

  try {
    const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''))
    return {
      finalGrade: parsed.finalGrade || 'Unknown',
      subject: parsed.subject || 'Unknown',
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      teacherFeedback: parsed.teacherFeedback || '',
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 0.8,
      expertAgreement: parsed.expertAgreement || '',
    }
  } catch (error) {
    console.error('[Gemini] Failed to parse synthesis:', error)
    throw new Error('Failed to synthesize analyses')
  }
}
