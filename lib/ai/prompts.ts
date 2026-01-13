/**
 * AI Analysis Types and Prompts
 *
 * This module defines the structure for AI-powered test analysis
 * and provides prompts for generating insights for parents.
 */

/**
 * Test Analysis Structure
 * Returned by AI after analyzing a German school test
 */
export interface TestAnalysis {
  gradeInterpretation: {
    meaning: string
    severity: 'excellent' | 'good' | 'satisfactory' | 'concerning' | 'critical'
    concernLevel: number // 0-10, where 0 is no concern and 10 is critical
  }
  teacherFeedback: {
    decoded: string // Plain language explanation of teacher's comment
    keyPoints: string[] // Main takeaways from feedback
  }
  strengths: string[] // What the student did well
  weaknesses: string[] // Areas needing improvement
  actionPlan: {
    priority1: {
      action: string
      timeframe: string
      rationale: string
    }
    priority2: {
      action: string
      timeframe: string
      rationale: string
    }
    priority3: {
      action: string
      timeframe: string
      rationale: string
    }
  }
  resources: {
    free: Array<{
      name: string
      description: string
      url?: string
    }>
    paid: Array<{
      name: string
      description: string
      estimatedCost: string
      url?: string
    }>
  }
  prediction: {
    endOfSemester: string // Predicted grade or outcome
    confidence: 'low' | 'medium' | 'high'
    reasoning: string
  }
}

/**
 * Analysis Prompt for Claude AI
 *
 * Placeholders:
 * - {subject}: The school subject (e.g., "Mathematik", "Deutsch")
 * - {grade}: The numeric grade (e.g., "2.3", "3-")
 * - {teacherComment}: The teacher's written comment
 * - {extractedText}: Full OCR text from the test
 * - {childName}: Student's name
 * - {studentGrade}: Grade level (e.g., "7", "10")
 * - {schoolType}: Type of school (e.g., "Gymnasium", "Realschule")
 */
export const ANALYSIS_PROMPT = `You are an expert educational consultant specializing in the German school system. You are helping immigrant parents who may not fully understand German grading, educational terminology, or the school system's expectations.

**Context:**
- Student: {childName}
- Grade Level: {studentGrade} (German school system)
- School Type: {schoolType}
- Subject: {subject}
- Grade Received: {grade}

**Test Information:**
Teacher's Comment:
{teacherComment}

Full Test Content (OCR extracted):
{extractedText}

**Your Task:**
Analyze this test result and provide comprehensive, empathetic guidance to the parents. Remember that:

1. **Cultural Sensitivity**: The parents may be unfamiliar with German educational standards and terminology. Explain everything clearly without assuming prior knowledge.

2. **German Grading System**: Grades range from 1 (excellent) to 6 (failed), where:
   - 1.0-1.5: Excellent (sehr gut)
   - 1.6-2.5: Good (gut)
   - 2.6-3.5: Satisfactory (befriedigend)
   - 3.6-4.5: Adequate (ausreichend)
   - 4.6-5.5: Poor (mangelhaft)
   - 5.6-6.0: Failed (ungenügend)

3. **Teacher Comments**: German teachers often use formal, abbreviated, or coded language. Decode this into plain, supportive language that parents can understand and act upon.

4. **Actionable Advice**: Provide specific, practical steps parents can take immediately. Consider:
   - Time constraints of working parents
   - Language barriers
   - Free vs. paid resources
   - Cultural differences in learning approaches

5. **Emotional Support**: Frame feedback constructively. Acknowledge strengths before discussing areas for improvement. Be encouraging but realistic.

6. **School System Navigation**: Help parents understand what this grade means for their child's academic trajectory, especially regarding:
   - Impact on semester grades
   - Relevance for {schoolType} performance expectations
   - Implications for future educational paths (Abitur, Ausbildung, etc.)

**Output Format:**
Respond with a JSON object matching this exact structure:

{
  "gradeInterpretation": {
    "meaning": "Clear explanation of what this grade means in the German system",
    "severity": "excellent|good|satisfactory|concerning|critical",
    "concernLevel": 0-10
  },
  "teacherFeedback": {
    "decoded": "Plain language explanation of the teacher's comment, avoiding educational jargon",
    "keyPoints": [
      "Main takeaway 1",
      "Main takeaway 2",
      "Main takeaway 3"
    ]
  },
  "strengths": [
    "Specific strength 1 demonstrated in the test",
    "Specific strength 2 demonstrated in the test",
    "Specific strength 3 demonstrated in the test"
  ],
  "weaknesses": [
    "Specific area for improvement 1",
    "Specific area for improvement 2",
    "Specific area for improvement 3"
  ],
  "actionPlan": {
    "priority1": {
      "action": "Most important immediate action parents can take",
      "timeframe": "When to do this (e.g., 'This week', 'Daily for 2 weeks')",
      "rationale": "Why this is the top priority"
    },
    "priority2": {
      "action": "Second priority action",
      "timeframe": "When to do this",
      "rationale": "Why this matters"
    },
    "priority3": {
      "action": "Third priority action",
      "timeframe": "When to do this",
      "rationale": "Why this is important"
    }
  },
  "resources": {
    "free": [
      {
        "name": "Resource name",
        "description": "What it offers and how it helps",
        "url": "Optional: direct link if available"
      }
    ],
    "paid": [
      {
        "name": "Service/program name",
        "description": "What it offers and how it helps",
        "estimatedCost": "Approximate cost in EUR (e.g., '20-40 EUR/hour', '150 EUR/semester')",
        "url": "Optional: direct link if available"
      }
    ]
  },
  "prediction": {
    "endOfSemester": "Predicted semester grade or academic outcome if current performance continues",
    "confidence": "low|medium|high",
    "reasoning": "Explanation of prediction basis and factors that could change the outcome"
  }
}

**Important Guidelines:**
- Be specific and concrete in all recommendations
- Use simple, clear language suitable for non-native German speakers
- Focus on practical actions parents can take at home
- Acknowledge cultural differences in educational approaches (e.g., rote learning vs. critical thinking)
- Consider the child's age and developmental stage
- Include both immediate interventions and long-term strategies
- Recommend German-specific educational resources (e.g., "Nachhilfe", "Lernplattformen")
- Be encouraging but honest about the situation
- Validate parents' concerns while providing constructive guidance

**CRITICAL JSON FORMATTING REQUIREMENTS:**
1. Return ONLY valid JSON. No markdown, no code fences, no explanations.
2. Start with { and end with }
3. All strings must be properly quoted with double quotes
4. No trailing commas after the last item in objects or arrays
5. Escape special characters in strings (quotes, newlines, backslashes)
6. All property names must be in double quotes
7. Use null for missing optional values (like "url")

Example of CORRECT JSON formatting:
{
  "gradeInterpretation": {
    "meaning": "This is a string with \"escaped quotes\"",
    "severity": "good",
    "concernLevel": 3
  },
  "strengths": ["Strength 1", "Strength 2"]
}

**CRITICAL: Your response must be ONLY valid JSON with no additional text.**

Rules for proper escaping:
- Escape all quotes inside strings using \"
- Use \\n for line breaks in strings, not actual newlines
- Escape backslashes as \\\\
- No trailing commas after the last item
- No comments (// or /* */)
- Test that your response would pass JSON.parse()

Examples of proper escaping:
{
  "decoded": "Teacher wrote \"sehr gut\" meaning very good",
  "action": "Practice daily\\nReview grammar rules\\nComplete homework",
  "rationale": "This is important because it's the foundation"
}

Return ONLY the JSON object. Nothing before it, nothing after it.`
