import { extractWithClaude } from './vision/claude-extract';
import { extractWithVisionOCR } from './vision/vision-ocr-extract';
import { generateTeacherReport } from './report/teacher-report';

export async function analyzeTest(
  images: Array<{base64: string, mimeType: string, pageNumber: number}>
) {
  const totalStart = Date.now();

  console.log('================================================================');
  console.log('[Analyze] STARTING TEACHER-STYLE ANALYSIS');
  console.log('[Analyze] Pages:', images.length);
  console.log('================================================================');

  // LAYER 1: Vision Extraction - Try Google Vision OCR first, fallback to Claude
  console.log('[Analyze] Layer 1: Extracting all content from images...');

  let extractResult: { success: boolean; error?: string; extraction: string; duration: number; provider: string; confidence?: number } = await extractWithVisionOCR(images);

  // Check if Vision OCR succeeded and has sufficient confidence
  if (!extractResult.success || (extractResult.confidence !== undefined && extractResult.confidence < 0.85)) {
    const confidenceMsg = extractResult.confidence !== undefined ?
      ` (confidence: ${(extractResult.confidence * 100).toFixed(1)}% < 85%)` : ' (failed)';
    console.log(`[Analyze] Vision OCR ${extractResult.success ? 'low confidence' : 'failed'}${confidenceMsg}, trying Claude as fallback...`);
    extractResult = await extractWithClaude(images);
  }

  if (!extractResult.success) {
    console.error('[Analyze] Layer 1 failed with all providers:', extractResult.error);
    return {
      success: false as const,
      error: `Vision extraction failed: ${extractResult.error}`,
      extraction: '',
      report: null,
      timing: { extraction: extractResult.duration, analysis: 0, total: Date.now() - totalStart },
    };
  }

  console.log('[Analyze] Layer 1 complete with', extractResult.provider, 'in', extractResult.duration, 'ms');

  // LAYER 2: Teacher Analysis
  console.log('[Analyze] Layer 2: Teacher analyzing the content...');

  const reportResult = await generateTeacherReport(extractResult.extraction);

  if (!reportResult.success) {
    console.error('[Analyze] Layer 2 failed:', reportResult.error);
    return {
      success: false as const,
      error: `Teacher analysis failed: ${reportResult.error}`,
      extraction: extractResult.extraction,
      report: null,
      timing: { extraction: extractResult.duration, analysis: reportResult.duration, total: Date.now() - totalStart },
    };
  }

  const totalDuration = Date.now() - totalStart;
  console.log('================================================================');
  console.log('[Analyze] ANALYSIS COMPLETE');
  console.log('[Analyze] Total time:', totalDuration, 'ms');
  console.log('================================================================');

  return {
    success: true as const,
    extraction: extractResult.extraction,
    report: reportResult.report,
    timing: {
      extraction: extractResult.duration,
      analysis: reportResult.duration,
      total: totalDuration,
    },
  };
}
