import { Language } from '@/lib/translations';
import { OPTIMIZED_ANALYSIS_PROMPT } from '@/lib/ai/optimized-prompt';

/**
 * AI Analysis Types and Prompts
 *
 * This module defines the structure for AI-powered test analysis
 * and provides prompts for generating insights for parents.
 */

/**
 * Comprehensive Test Analysis Structure
 * Matches the German school test report format
 */
export interface TestAnalysis {
  summary: {
    overallGrade: string; // e.g., "3+", "2-", "1"
    overallScore: number;
    maxScore: number;
    percentage: number;
    subject: string;
    topic?: string | undefined;
    childName: string;
    testDate?: string | undefined;
    executiveSummary?: string | undefined;
    confidence: number;
  };
  performance: {
    bySection: Array<{
      name: string;
      pointsAchieved: number;
      pointsPossible: number;
      percentage: number;
      notes?: string | undefined;
    }>;
    trends: string[];
  };
  teacherFeedback: {
    evaluationMethodology?: string | undefined;
    written: string;
    corrections: string[];
    praise: string[];
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: Array<{
    priority: number;
    category: string;
    action: string;
    timeframe: string;
    rationale: string;
    resources?: string[] | undefined;
  }>;
  timeManagement?: {
    assessment: string;
    suggestions: string[];
  } | undefined;
  languageEnhancement?: {
    applicable: boolean;
    notes?: string | undefined;
    grammarIssues?: string[] | undefined;
    vocabularyTips?: string[] | undefined;
  } | undefined;
  longTermDevelopment: {
    semesterPrediction: string;
    improvementAreas: string[];
    goalSetting: string;
  };
  metadata: {
    processingTime: number;
    timestamp: string;
    ocrConfidence: number;
    aiModel: string;
    processingSteps: string[];
  };
}

/**
 * Analysis Prompt for AI (now using optimized version)
 *
 * The optimized prompt is imported and used in getAnalysisPrompt()
 * This maintains backward compatibility while using better instructions.
 */
export const ANALYSIS_PROMPT = `DEPRECATED: Use optimized prompt instead`;

/**
 * Precise German Test Analysis Prompt
 * Focused on accurate grade extraction without hallucination
 */
export const GERMAN_TEST_ANALYSIS_PROMPT = `
You are analyzing a German school test (Klassenarbeit). The document has multiple pages.

CRITICAL RULES:
1. NEVER guess or hallucinate a grade - if you can't find it clearly, return null
2. Search ALL pages for the grade (often on last pages or cover sheet)
3. Teacher comments are usually in RED ink
4. The reading article is NOT the student's work

SEARCH FOR:
1. GRADE: Look for "Note:", numbers 1-6, or German grade words (sehr gut, gut, befriedigend, ausreichend, mangelhaft, ungenügend)
2. POINTS: Look for "X/100", "X von Y", "Punkte:"
3. STUDENT NAME: Look for "Name:", handwritten name at top
4. DATE: Look for "Datum:" or date format DD.MM.YYYY
5. TEACHER COMMENTS: Usually at the end, often starts with "Liebe/r..." or personal feedback

DOCUMENT TEXT (all pages):
{extractedText}

RESPOND IN JSON ONLY:
{
  "grade": {
    "value": "5" or null if not found,
    "points": "35/100" or null,
    "confidence": "high" | "medium" | "low" | "not_found"
  },
  "student": {
    "name": "Found name" or null,
    "class": "10B" or null
  },
  "teacherComment": {
    "text": "Exact quote of main teacher comment" or null,
    "foundOnPage": 8 or null
  },
  "strengths": [
    "Specific strength based on document evidence"
  ],
  "weaknesses": [
    "Specific weakness based on teacher feedback"
  ],
  "recommendations": [
    "Actionable recommendation based on identified weaknesses"
  ]
}
`;

/**
 * Function version for easier parameterization
 * Used by comprehensive AI modules (claude-comprehensive, gemini-comprehensive, mistral)
 */

export function getAnalysisPrompt(
  extractedText: string,
  childName: string,
  studentGrade: string | number,
  subject?: string,
  grade?: string,
  teacherComment?: string,
  schoolType?: string,
  targetLanguage: Language | string = 'en'
): string {
  const languageNames: Record<string, string> = {
    de: 'German',
    en: 'English',
    ar: 'Arabic',
    tr: 'Turkish',
    ro: 'Romanian',
    ru: 'Russian',
  };

  const languageLabel = languageNames[targetLanguage] || String(targetLanguage) || 'English';

  const overrideHeader = `IMPORTANT OUTPUT LANGUAGE DIRECTIVE:\n- Work in English internally for accuracy.\n- Return JSON only. All narrative text values (strings) must be in ${languageLabel}.\n- Keep names, grades, points, and numbers exactly as seen; do NOT translate numbers or names.\n- If instructions below conflict, this directive wins.\n- Respond with JSON only.`;

  // Use the optimized English prompt
  const basePrompt = OPTIMIZED_ANALYSIS_PROMPT(extractedText, childName, String(studentGrade));
  
  return `${overrideHeader}\n\n${basePrompt}`;
}
