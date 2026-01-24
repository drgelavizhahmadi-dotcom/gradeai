import { z } from 'zod';
import { TestAnalysis } from './prompts';

export const TestAnalysisSchema = z.object({
  summary: z.object({
    overallGrade: z.string(),
    overallScore: z.number(),
    maxScore: z.number(),
    percentage: z.number(),
    subject: z.string(),
    topic: z.string().optional(),
    childName: z.string(),
    testDate: z.string().optional(),
    executiveSummary: z.string().optional(),
    confidence: z.number(),
  }),
  performance: z.object({
    bySection: z.array(z.object({
      name: z.string(),
      pointsAchieved: z.number(),
      pointsPossible: z.number(),
      percentage: z.number(),
      notes: z.string().optional(),
    })),
    trends: z.array(z.string()),
  }),
  teacherFeedback: z.object({
    evaluationMethodology: z.string().optional(),
    written: z.string(),
    corrections: z.array(z.string()),
    praise: z.array(z.string()),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendations: z.array(z.object({
    priority: z.number(),
    category: z.string(),
    action: z.string(),
    timeframe: z.string(),
    rationale: z.string(),
    resources: z.array(z.string()).optional(),
  })),
  timeManagement: z.object({
    assessment: z.string(),
    suggestions: z.array(z.string()),
  }).optional(),
  languageEnhancement: z.object({
    applicable: z.boolean(),
    notes: z.string().optional(),
  }).optional(),
  longTermDevelopment: z.object({
    semesterPrediction: z.string(),
    improvementAreas: z.array(z.string()),
    goalSetting: z.string(),
  }),
  metadata: z.object({
    processingTime: z.number(),
    timestamp: z.string(),
    ocrConfidence: z.number(),
    aiModel: z.string(),
    processingSteps: z.array(z.string()),
  }),
});

export function validateTestAnalysis(data: any): TestAnalysis {
  const result = TestAnalysisSchema.safeParse(data);
  if (!result.success) {
    throw new Error('Invalid TestAnalysis structure: ' + JSON.stringify(result.error.issues));
  }
  return result.data;
}
