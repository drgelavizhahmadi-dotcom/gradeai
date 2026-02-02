import Anthropic from '@anthropic-ai/sdk';
import { PageImage, VisionAnalysisResult, createEmptyResult } from './types';
import {
  VISION_EXTRACTION_SYSTEM,
  VISION_EXTRACTION_PROMPT,
} from '../prompts/vision-extraction-prompt';
import {
  AI_REPORT_SYSTEM,
  AI_REPORT_PROMPT,
} from '../prompts/ai-report-prompt';

export async function analyzeWithClaudeVision(
  images: PageImage[]
): Promise<VisionAnalysisResult> {
  const startTime = Date.now();
  console.log('[Claude Vision] ========================================');
  console.log('[Claude Vision] Starting TWO-LAYER analysis');
  console.log('[Claude Vision] Pages:', images.length);
  console.log('[Claude Vision] Total size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[Claude Vision] ANTHROPIC_API_KEY not configured');
    return createEmptyResult('claude', 'ANTHROPIC_API_KEY not configured', Date.now() - startTime, images.length);
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    // ================================================================
    // LAYER 1: VISION EXTRACTION - Get ALL text from images
    // ================================================================
    console.log('[Claude Vision] === LAYER 1: Vision Extraction ===');

    const visionContent: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    for (const img of images) {
      visionContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mimeType,
          data: img.base64,
        },
      });
      visionContent.push({
        type: 'text',
        text: `[Page ${img.pageNumber} of ${images.length}]`,
      });
    }

    visionContent.push({
      type: 'text',
      text: VISION_EXTRACTION_PROMPT,
    });

    console.log('[Claude Vision] Sending vision extraction request to claude-sonnet-4-20250514...');

    const visionResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: VISION_EXTRACTION_SYSTEM,
      messages: [{ role: 'user', content: visionContent }],
    });

    const visionText = visionResponse.content.find(c => c.type === 'text');
    if (!visionText || visionText.type !== 'text') {
      throw new Error('No text response from Claude vision extraction');
    }

    const rawExtraction = visionText.text;
    const layer1Duration = Date.now() - startTime;

    console.log(`[Claude Vision] Layer 1 complete in ${layer1Duration}ms`);
    console.log(`[Claude Vision] Extracted ${rawExtraction.length} characters`);
    console.log(`[Claude Vision] Tokens: input=${visionResponse.usage.input_tokens}, output=${visionResponse.usage.output_tokens}`);
    console.log('[Claude Vision] Preview:', rawExtraction.substring(0, 300));

    // ================================================================
    // LAYER 2: AI REPORT - Create structured report from extraction
    // ================================================================
    console.log('[Claude Vision] === LAYER 2: AI Report Generation ===');

    const reportPrompt = AI_REPORT_PROMPT.replace('{visionExtraction}', rawExtraction);

    console.log('[Claude Vision] Sending report generation request...');

    const reportResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: AI_REPORT_SYSTEM,
      messages: [{ role: 'user', content: reportPrompt }],
    });

    const reportText = reportResponse.content.find(c => c.type === 'text');
    if (!reportText || reportText.type !== 'text') {
      throw new Error('No text response from Claude report generation');
    }

    const durationMs = Date.now() - startTime;
    const layer2Duration = durationMs - layer1Duration;

    console.log(`[Claude Vision] Layer 2 complete in ${layer2Duration}ms`);
    console.log(`[Claude Vision] Total duration: ${durationMs}ms`);
    console.log(`[Claude Vision] Report tokens: input=${reportResponse.usage.input_tokens}, output=${reportResponse.usage.output_tokens}`);

    // Parse JSON from response
    const jsonMatch = reportText.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Claude Vision] No JSON found in report response');
      console.error('[Claude Vision] Response preview:', reportText.text.substring(0, 500));
      throw new Error('Invalid response format - no JSON found in report');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log('[Claude Vision] ✓ Grade:', parsed.grade?.value || 'NOT FOUND');
    console.log('[Claude Vision] ✓ Confidence:', parsed.grade?.confidence);
    console.log('[Claude Vision] ✓ Student:', parsed.student?.name || 'NOT FOUND');
    console.log('[Claude Vision] ✓ Subject:', parsed.test?.subject || 'NOT FOUND');
    console.log('[Claude Vision] ✓ Strengths:', parsed.strengths?.length || 0);
    console.log('[Claude Vision] ✓ Weaknesses:', parsed.weaknesses?.length || 0);
    console.log('[Claude Vision] ✓ Recommendations:', parsed.recommendations?.length || 0);

    return {
      provider: 'claude',
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
        rawResponse: reportText.text.substring(0, 500),
      },
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Claude Vision] ✗ Error:', error);
    return createEmptyResult('claude', error instanceof Error ? error.message : 'Unknown error', durationMs, images.length);
  }
}
