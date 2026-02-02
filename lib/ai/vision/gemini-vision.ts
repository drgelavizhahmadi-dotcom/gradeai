import { GoogleGenerativeAI } from '@google/generative-ai';
import { PageImage, VisionAnalysisResult, createEmptyResult } from './types';
import {
  VISION_EXTRACTION_SYSTEM,
  VISION_EXTRACTION_PROMPT,
} from '../prompts/vision-extraction-prompt';
import {
  AI_REPORT_SYSTEM,
  AI_REPORT_PROMPT,
} from '../prompts/ai-report-prompt';

export async function analyzeWithGeminiVision(
  images: PageImage[]
): Promise<VisionAnalysisResult> {
  const startTime = Date.now();
  console.log('[Gemini Vision] ========================================');
  console.log('[Gemini Vision] Starting TWO-LAYER analysis');
  console.log('[Gemini Vision] Pages:', images.length);
  console.log('[Gemini Vision] Total size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini Vision] GOOGLE_API_KEY not configured');
    return createEmptyResult('gemini', 'GOOGLE_API_KEY not configured', Date.now() - startTime, images.length);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // ================================================================
    // LAYER 1: VISION EXTRACTION - Get ALL text from images
    // ================================================================
    console.log('[Gemini Vision] === LAYER 1: Vision Extraction ===');

    const visionModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: VISION_EXTRACTION_SYSTEM,
    });

    const visionParts: any[] = [];

    for (const img of images) {
      visionParts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
      visionParts.push({ text: `[Page ${img.pageNumber} of ${images.length}]` });
    }

    visionParts.push({ text: VISION_EXTRACTION_PROMPT });

    console.log('[Gemini Vision] Sending vision extraction request to gemini-2.0-flash...');

    const visionResult = await visionModel.generateContent(visionParts);
    const visionResponse = await visionResult.response;
    const rawExtraction = visionResponse.text();

    const layer1Duration = Date.now() - startTime;

    console.log(`[Gemini Vision] Layer 1 complete in ${layer1Duration}ms`);
    console.log(`[Gemini Vision] Extracted ${rawExtraction.length} characters`);
    console.log('[Gemini Vision] Preview:', rawExtraction.substring(0, 300));

    // ================================================================
    // LAYER 2: AI REPORT - Create structured report from extraction
    // ================================================================
    console.log('[Gemini Vision] === LAYER 2: AI Report Generation ===');

    const reportModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: AI_REPORT_SYSTEM,
    });

    const reportPrompt = AI_REPORT_PROMPT.replace('{visionExtraction}', rawExtraction);

    console.log('[Gemini Vision] Sending report generation request...');

    const reportResult = await reportModel.generateContent(reportPrompt);
    const reportResponse = await reportResult.response;
    const reportText = reportResponse.text();

    const durationMs = Date.now() - startTime;
    const layer2Duration = durationMs - layer1Duration;

    console.log(`[Gemini Vision] Layer 2 complete in ${layer2Duration}ms`);
    console.log(`[Gemini Vision] Total duration: ${durationMs}ms`);

    // Parse JSON from response
    const jsonMatch = reportText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Gemini Vision] No JSON found in report response');
      console.error('[Gemini Vision] Response preview:', reportText.substring(0, 500));
      throw new Error('Invalid response format - no JSON found in report');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log('[Gemini Vision] ✓ Grade:', parsed.grade?.value || 'NOT FOUND');
    console.log('[Gemini Vision] ✓ Confidence:', parsed.grade?.confidence);
    console.log('[Gemini Vision] ✓ Student:', parsed.student?.name || 'NOT FOUND');
    console.log('[Gemini Vision] ✓ Subject:', parsed.test?.subject || 'NOT FOUND');
    console.log('[Gemini Vision] ✓ Strengths:', parsed.strengths?.length || 0);
    console.log('[Gemini Vision] ✓ Weaknesses:', parsed.weaknesses?.length || 0);
    console.log('[Gemini Vision] ✓ Recommendations:', parsed.recommendations?.length || 0);

    return {
      provider: 'gemini',
      success: true,
      durationMs,
      student: parsed.student || { name: null, class: null },
      test: parsed.test || { subject: null, date: null, topic: null, duration: null },
      grade: parsed.grade || { value: null, description: null, points: null, breakdown: null, confidence: 'not_found', foundOnPage: null },
      teacherFeedback: parsed.teacherFeedback || { mainComment: null, marginNotes: [], corrections: [], tone: null },
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      recommendations: parsed.recommendations || [],
      metadata: {
        pagesAnalyzed: images.length,
        confidence: parsed.metadata?.confidence || 0,
        hasRedMarks: parsed.metadata?.hasRedMarks || false,
        hasHandwriting: parsed.metadata?.hasHandwriting || false,
        rawExtraction: rawExtraction.substring(0, 1000),
        rawResponse: reportText.substring(0, 500),
      },
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Gemini Vision] ✗ Error:', error);
    return createEmptyResult('gemini', error instanceof Error ? error.message : 'Unknown error', durationMs, images.length);
  }
}
