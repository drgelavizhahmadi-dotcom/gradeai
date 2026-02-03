import { extractWithClaude } from './vision/claude-extract';
import { extractWithVisionOCR } from './vision/vision-ocr-extract';
import { generateReportWithClaude } from './report/claude-report';
import { generateTeacherReport } from './report/teacher-report';

export interface AnalyzeOptions {
  useTeacherReport?: boolean; // Use teacher-focused constructive reports
}

export async function analyzeTest(
  images: Array<{base64: string, mimeType: string, pageNumber: number}>,
  options: AnalyzeOptions = {}
) {
  const { useTeacherReport = false } = options;
  const totalStart = Date.now();

  console.log('================================================================');
  console.log('[Analyze] STARTING TWO-LAYER ANALYSIS');
  console.log('[Analyze] Pages:', images.length);
  console.log('================================================================');

  // LAYER 1: Vision Extraction - Try Google Vision OCR first, fallback to Claude if accuracy < 85%
  console.log('[Analyze] Layer 1: Vision Extraction...');

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
      timing: { layer1: extractResult.duration, layer2: 0, total: Date.now() - totalStart },
      providers: { vision: extractResult.provider, report: 'claude' },
    };
  }

  console.log('[Analyze] Layer 1 complete with', extractResult.provider, 'in', extractResult.duration, 'ms');

  // LAYER 2: Report Generation - Choose between regular or teacher-focused
  const reportType = useTeacherReport ? 'Teacher-Focused' : 'Standard';
  console.log(`[Analyze] Layer 2: ${reportType} Report Generation...`);

  const reportResult = useTeacherReport
    ? await generateTeacherReport(extractResult.extraction)
    : await generateReportWithClaude(extractResult.extraction);

  if (!reportResult.success) {
    console.error('[Analyze] Layer 2 failed:', reportResult.error);
    return {
      success: false as const,
      error: `Report generation failed: ${reportResult.error}`,
      extraction: extractResult.extraction,
      report: null,
      timing: { layer1: extractResult.duration, layer2: reportResult.duration, total: Date.now() - totalStart },
      providers: { vision: extractResult.provider, report: 'claude' },
    };
  }

  const totalDuration = Date.now() - totalStart;
  console.log('================================================================');
  console.log('[Analyze] ANALYSIS COMPLETE');
  console.log('[Analyze] Total time:', totalDuration, 'ms');
  console.log('[Analyze] Vision provider:', extractResult.provider);
  console.log('[Analyze] Report type:', useTeacherReport ? 'Teacher-Focused' : 'Standard');

  // Get student name from appropriate field based on report type
  const studentName = useTeacherReport
    ? reportResult.report?.schueler?.name
    : reportResult.report?.student?.name;

  // Get grade from appropriate field based on report type
  const grade = useTeacherReport
    ? reportResult.report?.leistung?.gesamtnote?.wert
    : reportResult.report?.grade?.value;

  console.log('[Analyze] Student:', studentName);
  console.log('[Analyze] Grade:', grade);
  console.log('================================================================');

  return {
    success: true as const,
    extraction: extractResult.extraction,
    report: reportResult.report,
    timing: {
      layer1: extractResult.duration,
      layer2: reportResult.duration,
      total: totalDuration,
    },
    providers: {
      vision: extractResult.provider,
      report: useTeacherReport ? 'teacher-claude' : 'claude',
    },
  };
}
