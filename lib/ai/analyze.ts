import { extractWithClaude } from './vision/claude-extract';
import { extractWithVisionOCR } from './vision/vision-ocr-extract';
import { generateTeacherReport } from './report/teacher-report';
import { translateReport, LanguageCode } from './translate/translate-report';

export async function analyzeTest(
  images: Array<{base64: string, mimeType: string, pageNumber: number}>,
  options?: { language?: LanguageCode }
) {
  const targetLanguage = options?.language || 'de';
  const totalStart = Date.now();

  console.log('================================================================');
  console.log('[Analyze] STARTING ANALYSIS');
  console.log('[Analyze] Pages:', images.length);
  console.log('[Analyze] Target language:', targetLanguage);
  console.log('================================================================');

  // LAYER 1: Vision Extraction - Try Google Vision OCR first, fallback to Claude
  console.log('[Analyze] LAYER 1: Vision Extraction...');

  let extractResult: { success: boolean; error?: string; extraction: string; duration: number; provider: string; confidence?: number } = await extractWithVisionOCR(images);

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
      reportOriginal: null,
      timing: { extraction: extractResult.duration, analysis: 0, translation: 0, total: Date.now() - totalStart },
    };
  }

  console.log('[Analyze] Layer 1 complete with', extractResult.provider, 'in', extractResult.duration, 'ms');

  // LAYER 2: Teacher Analysis (always German)
  console.log('[Analyze] LAYER 2: Teacher Analysis...');

  const reportResult = await generateTeacherReport(extractResult.extraction);

  if (!reportResult.success) {
    console.error('[Analyze] Layer 2 failed:', reportResult.error);
    return {
      success: false as const,
      error: `Teacher analysis failed: ${reportResult.error}`,
      extraction: extractResult.extraction,
      report: null,
      reportOriginal: null,
      timing: { extraction: extractResult.duration, analysis: reportResult.duration, translation: 0, total: Date.now() - totalStart },
    };
  }

  console.log('[Analyze] Layer 2 complete');

  // LAYER 3: Translation (if needed)
  let finalReport = reportResult.report;
  let translationDuration = 0;

  if (targetLanguage !== 'de') {
    console.log('[Analyze] LAYER 3: Translation to', targetLanguage, '...');
    const translateResult = await translateReport(reportResult.report, targetLanguage);
    translationDuration = translateResult.duration || 0;
    if (translateResult.success) {
      finalReport = translateResult.translatedReport;
      console.log('[Analyze] Layer 3 complete');
    } else {
      console.warn('[Analyze] Translation failed, using German report:', translateResult.error);
    }
  }

  const totalDuration = Date.now() - totalStart;
  console.log('================================================================');
  console.log('[Analyze] COMPLETE in', totalDuration, 'ms');
  console.log('================================================================');

  return {
    success: true as const,
    extraction: extractResult.extraction,
    report: finalReport,
    reportOriginal: reportResult.report,
    timing: {
      extraction: extractResult.duration,
      analysis: reportResult.duration,
      translation: translationDuration,
      total: totalDuration,
    },
  };
}
