/**
 * Main entry point for multi-AI vision test analysis
 * Analyzes uploaded test images using Claude, Gemini, and Mistral in parallel
 */

import { analyzeTestWithMultiVision, ConsensusResult } from './ai/vision';
import { prepareMultipleImages, prepareImageForVision, convertPdfToImages } from './utils/pdf-to-images';
import { TestAnalysis } from './ai/prompts';
import { convertGermanGrade } from './ocr/gradeConverter';

export interface AnalyzeTestOptions {
  childName?: string;
  subject?: string;
  providers?: ('claude' | 'gemini' | 'mistral')[];
  targetLanguage?: string;
}

export interface AnalyzeTestResult {
  consensus: ConsensusResult;
  analysis: TestAnalysis;
  warnings: string[];
  confidence: number;
}

export async function analyzeUploadedTest(
  fileBuffer: Buffer | Buffer[],
  mimeType: string | string[],
  options?: AnalyzeTestOptions
): Promise<AnalyzeTestResult> {
  console.log('================================================================');
  console.log('[Analyze Test] STARTING MULTI-AI VISION ANALYSIS');

  const buffers = Array.isArray(fileBuffer) ? fileBuffer : [fileBuffer];
  const mimeTypes = Array.isArray(mimeType) ? mimeType : [mimeType];

  console.log('[Analyze Test] Files to analyze:', buffers.length);
  console.log('[Analyze Test] Total size:', buffers.reduce((s, b) => s + b.length, 0) / 1024, 'KB');
  console.log('[Analyze Test] MIME types:', mimeTypes.join(', '));
  console.log('================================================================');

  // Convert files to images
  const images = await prepareMultipleImages(buffers, mimeTypes);

  if (images.length === 0) {
    throw new Error('No images could be extracted from files');
  }

  console.log('[Analyze Test] Images prepared:', images.length);
  console.log('[Analyze Test] Total image size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');

  // Run multi-AI vision analysis
  const visionOptions = options?.providers ? { providers: options.providers } : undefined;
  const consensus = await analyzeTestWithMultiVision(images, visionOptions);

  // Transform consensus result to TestAnalysis format for compatibility
  const analysis = transformToTestAnalysis(consensus, options);

  console.log('[Analyze Test] ✓ ANALYSIS COMPLETE');
  console.log('[Analyze Test] Grade:', consensus.finalResult.grade.value);
  console.log('[Analyze Test] Confidence:', consensus.overallConfidence.toFixed(0));

  return {
    consensus,
    analysis,
    warnings: consensus.warnings,
    confidence: consensus.overallConfidence,
  };
}

/**
 * Transform ConsensusResult to legacy TestAnalysis format for backward compatibility
 */
function transformToTestAnalysis(
  consensus: ConsensusResult,
  options?: AnalyzeTestOptions
): TestAnalysis {
  const result = consensus.finalResult;
  const gradeValue = result.grade.value;
  const gradeFloat = gradeValue ? convertGermanGrade(gradeValue) || 0 : 0;

  // Calculate percentage from grade
  const gradeToPercentage = (g: number): number => {
    if (g <= 1) return 100;
    if (g <= 2) return 85;
    if (g <= 3) return 70;
    if (g <= 4) return 55;
    if (g <= 5) return 40;
    return 25;
  };

  // Extract points if available
  let score = 0;
  let maxScore = 100;
  if (result.grade.points && typeof result.grade.points === 'string') {
    const pointsMatch = result.grade.points.match(/(\d+)\s*(?:\/|von)\s*(\d+)/);
    if (pointsMatch) {
      score = parseInt(pointsMatch[1], 10);
      maxScore = parseInt(pointsMatch[2], 10);
    }
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : gradeToPercentage(gradeFloat);

  // Build bySection from grade breakdown
  const bySection = result.grade.breakdown
    ? Object.entries(result.grade.breakdown).map(([name, value]) => {
        // Ensure value is a string before calling .match()
        const valueStr = typeof value === 'string' ? value : String(value || '');
        const pointsMatch = valueStr.match(/(\d+)\s*(?:\/|von)\s*(\d+)/);
        const achieved = pointsMatch ? parseInt(pointsMatch[1], 10) : 0;
        const possible = pointsMatch ? parseInt(pointsMatch[2], 10) : 0;
        return {
          name,
          pointsAchieved: achieved,
          pointsPossible: possible,
          percentage: possible > 0 ? Math.round((achieved / possible) * 100) : 0,
          notes: '',
        };
      })
    : [];

  // Build recommendations
  const recommendations = result.recommendations.map((rec, idx) => ({
    priority: rec.priority === 'high' ? 1 : rec.priority === 'medium' ? 2 : 3,
    category: rec.basedOn || 'General',
    action: rec.action,
    timeframe: rec.timeframe || '1-2 weeks',
    rationale: rec.basedOn,
    resources: [],
  }));

  return {
    summary: {
      overallGrade: gradeValue || 'Unknown',
      overallScore: score,
      maxScore,
      percentage,
      subject: result.test.subject || options?.subject || 'Unknown',
      childName: result.student.name || options?.childName || 'Student',
      testDate: result.test.date || undefined,
      topic: result.test.topic || undefined,
      executiveSummary: generateExecutiveSummary(result, gradeFloat),
      confidence: consensus.overallConfidence / 100,
    },
    performance: {
      bySection,
      trends: [],
    },
    teacherFeedback: {
      // Handle mainComment as either string or object with text property
      written: typeof result.teacherFeedback.mainComment === 'string'
        ? result.teacherFeedback.mainComment
        : ((result.teacherFeedback.mainComment as any)?.text || ''),
      corrections: result.teacherFeedback.corrections,
      praise: result.strengths.map(s => s.point).slice(0, 3),
      evaluationMethodology: result.teacherFeedback.tone
        ? `Teacher feedback tone: ${result.teacherFeedback.tone}`
        : undefined,
    },
    strengths: result.strengths.map(s => s.point),
    weaknesses: result.weaknesses.map(w => w.point),
    recommendations,
    longTermDevelopment: {
      semesterPrediction: generatePrediction(gradeFloat),
      improvementAreas: result.weaknesses.map(w => w.point),
      goalSetting: generateGoals(result.weaknesses, gradeFloat),
    },
    metadata: {
      processingTime: result.durationMs,
      timestamp: new Date().toISOString(),
      ocrConfidence: consensus.overallConfidence / 100,
      aiModel: `Multi-AI Vision (${consensus.consensus.providersSucceeded.join(', ')})`,
      processingSteps: [
        'Image preparation',
        'Multi-AI vision analysis',
        `Consensus merge (${consensus.consensus.gradeAgreement} agreement)`,
      ],
    },
  };
}

function generateExecutiveSummary(result: any, gradeFloat: number): string {
  const gradeDesc = gradeFloat <= 2 ? 'good' : gradeFloat <= 3 ? 'satisfactory' : gradeFloat <= 4 ? 'below average' : 'insufficient';
  const subject = result.test.subject || 'this test';
  const strengthCount = result.strengths?.length || 0;
  const weaknessCount = result.weaknesses?.length || 0;

  let summary = `Overall ${gradeDesc} performance on ${subject}`;

  if (result.grade.value) {
    summary += ` with grade ${result.grade.value}`;
  }

  if (strengthCount > 0) {
    summary += `. Key strength: ${result.strengths[0].point}`;
  }

  if (weaknessCount > 0) {
    summary += `. Area for improvement: ${result.weaknesses[0].point}`;
  }

  return summary + '.';
}

function generatePrediction(gradeFloat: number): string {
  if (gradeFloat <= 1.5) return 'Excellent trajectory - likely to maintain top performance';
  if (gradeFloat <= 2.5) return 'Good progress - expected to achieve strong results';
  if (gradeFloat <= 3.5) return 'Satisfactory - with focused effort, improvement is achievable';
  if (gradeFloat <= 4.5) return 'Needs support - targeted intervention recommended';
  return 'Requires immediate attention - intensive support needed';
}

function generateGoals(weaknesses: any[], gradeFloat: number): string {
  if (weaknesses.length === 0) {
    return 'Continue current study habits and maintain performance level.';
  }

  const priorityArea = weaknesses[0]?.point || 'identified areas';
  const targetGrade = Math.max(1, Math.floor(gradeFloat) - 1);

  return `Focus on improving ${priorityArea}. Target: achieve grade ${targetGrade} on next assessment.`;
}

// Re-export types and functions for convenience
export type { ConsensusResult } from './ai/vision';
export { analyzeTestWithMultiVision } from './ai/vision';
export { prepareMultipleImages, prepareImageForVision, convertPdfToImages } from './utils/pdf-to-images';
