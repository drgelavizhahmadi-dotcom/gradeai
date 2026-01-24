/**
 * AI ANALYSIS PROMPT - ALWAYS IN ENGLISH
 * 
 * This prompt analyzes the uploaded test image and returns
 * structured JSON data that is language-agnostic.
 * 
 * The translation to user's language happens AFTER this step.
 */

export interface AnalysisMetadata {
  studentName?: string
  subject?: string
  gradeLevel?: string
}

export const createAnalysisPrompt = (imageData: string, metadata: AnalysisMetadata = {}) => {
  return `
You are an expert educational analyst specializing in German school test analysis.

TASK: Analyze the uploaded test image and extract ALL relevant information.

INPUT:
- Test image: [attached]
- Student name (if known): ${metadata.studentName || 'Unknown'}
- Subject (if known): ${metadata.subject || 'Unknown'}
- Grade level (if known): ${metadata.gradeLevel || 'Unknown'}

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no explanation)

{
  "header": {
    "subject": "string - detected subject name in German",
    "subjectKey": "string - english key like 'english', 'math', 'german'",
    "gradeLevel": "string - e.g., 'Oberstufe Q-Phase', '10. Klasse'",
    "studentName": "string - detected or provided",
    "date": "string - detected date or null",
    "grade": "string - German grade like '2+', '3', '5-'",
    "gradeNumeric": "number - 1-6 scale",
    "percentage": "number - 0-100",
    "totalPoints": "number - points achieved",
    "maxPoints": "number - maximum possible points"
  },
  
  "examStructure": [
    {
      "taskNumber": "number",
      "taskType": "string - 'essay', 'mediation', 'analysis', 'grammar', etc.",
      "taskTypeGerman": "string - German name",
      "topic": "string - topic/question in original language",
      "requirement": "string - what was required",
      "weight": "number - percentage weight",
      "wordCountActual": "number or null",
      "wordCountRequired": "number or null",
      "pointsAchieved": "number",
      "pointsMax": "number",
      "completed": "boolean"
    }
  ],
  
  "scores": {
    "byTask": [
      {
        "taskNumber": "number",
        "criteria": [
          {
            "criterionKey": "string - 'content', 'language', 'structure', 'register', 'grammar', 'spelling'",
            "score": "number",
            "maxScore": "number",
            "isCritical": "boolean - true if this is a major problem area"
          }
        ]
      }
    ],
    "overall": {
      "achieved": "number",
      "maximum": "number",
      "percentage": "number"
    }
  },
  
  "teacherCorrections": {
    "marks": [
      {
        "markType": "string - 'SP', 'Gr', 'R', 'A', 'Z', 'W', 'Sb', 'T', etc.",
        "meaning": "string - what this mark means in English",
        "count": "number",
        "severity": "string - 'minor', 'moderate', 'major'"
      }
    ],
    "comments": [
      {
        "text": "string - original comment text",
        "location": "string - where on the test",
        "sentiment": "string - 'positive', 'neutral', 'negative', 'constructive'"
      }
    ],
    "totalCorrections": "number"
  },
  
  "fairnessAssessment": {
    "overallFairness": "string - 'fair', 'possibly_strict', 'possibly_lenient', 'review_recommended'",
    "deductionsTraceable": "boolean",
    "criteriaTransparent": "boolean",
    "correctionsConsistent": "boolean",
    "potentialIssues": ["string - list of any concerns"] or null,
    "reasoning": "string - brief explanation"
  },
  
  "errorAnalysis": [
    {
      "errorType": "string - 'pronoun_confusion', 'verb_conjugation', 'spelling', 'register', 'tense', 'article', etc.",
      "errorTypeHuman": "string - human readable name in English",
      "frequency": "number - how many times this error occurred",
      "severity": "string - 'minor', 'moderate', 'major'",
      "examples": [
        {
          "wrong": "string - what student wrote",
          "correct": "string - correct version",
          "context": "string - sentence or phrase context"
        }
      ],
      "explanation": "string - why this is wrong (in English)",
      "rule": "string - the grammar/spelling rule (in English)",
      "isSystematic": "boolean - true if this appears to be a pattern"
    }
  ],
  
  "strengthsIdentified": [
    {
      "strengthType": "string - 'content_understanding', 'creativity', 'effort', 'structure', 'vocabulary', etc.",
      "description": "string - specific description in English",
      "evidence": "string - quote or reference from the test"
    }
  ],
  
  "riskAssessment": {
    "promotionRisk": "string - 'low', 'medium', 'high'",
    "urgencyLevel": "string - 'none', 'monitor', 'action_needed', 'urgent'",
    "recommendedNextGrade": "string - e.g., '4+' to pass",
    "remainingExamsEstimate": "number or null"
  },
  
  "recommendedActions": {
    "immediate": [
      {
        "action": "string - action in English",
        "priority": "number - 1 is highest",
        "timeframe": "string - 'this_week', 'next_2_weeks', 'this_month'"
      }
    ],
    "learningPlan": [
      {
        "focus": "string - what to focus on",
        "activities": ["string - specific activities"],
        "timeCommitment": "string - e.g., '15 min daily'",
        "duration": "string - e.g., 'weeks 1-4'",
        "successMetric": "string - how to measure success",
        "resources": ["string - suggested resources"]
      }
    ]
  },
  
  "metadata": {
    "analysisConfidence": "number - 0-100",
    "ocrConfidence": "number - 0-100",
    "imageQuality": "string - 'good', 'medium', 'poor'",
    "analysisTimestamp": "string - ISO timestamp",
    "warnings": ["string - any analysis warnings"]
  }
}

IMPORTANT RULES:
1. Extract ALL visible information from the test
2. Be accurate - don't guess if information is not visible
3. Use null for missing information, don't make up data
4. Keep all text fields in their ORIGINAL language where applicable (German test content)
5. Use English for your analytical descriptions and explanations
6. Be thorough in error analysis - this helps parents understand
7. Be fair and balanced in your assessment
8. Identify positives even in poor-performing tests

Return ONLY the JSON object, no other text.
`
}
