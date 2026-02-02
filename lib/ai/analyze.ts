import { extractWithGemini } from './vision/gemini-extract';
import { extractWithClaude } from './vision/claude-extract';
import { generateReportWithClaude } from './report/claude-report';

export async function analyzeTest(images: Array<{base64: string, mimeType: string, pageNumber: number}>) {
  const totalStart = Date.now();

  console.log('================================================================');
  console.log('[Analyze] STARTING TWO-LAYER ANALYSIS');
  console.log('[Analyze] Pages:', images.length);
  console.log('================================================================');

  // LAYER 1: Vision Extraction - Try Gemini first, fallback to Claude
  console.log('[Analyze] Layer 1: Vision Extraction...');

  let extractResult: { success: boolean; error?: string; extraction: string; duration: number; provider: string } = await extractWithGemini(images);

  if (!extractResult.success) {
    console.log('[Analyze] Gemini failed, trying Claude as fallback...');
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

  // LAYER 2: Report Generation with Claude (quality)
  console.log('[Analyze] Layer 2: Claude Report Generation...');
  const reportResult = await generateReportWithClaude(extractResult.extraction);

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
  console.log('[Analyze] Student:', reportResult.report?.student?.name);
  console.log('[Analyze] Grade:', reportResult.report?.grade?.value);
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
      report: 'claude',
    },
  };
}
