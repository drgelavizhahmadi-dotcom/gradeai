import { PageImage, VisionAnalysisResult, createEmptyResult } from './types';
import {
  VISION_EXTRACTION_SYSTEM,
  VISION_EXTRACTION_PROMPT,
} from '../prompts/vision-extraction-prompt';
import {
  AI_REPORT_SYSTEM,
  AI_REPORT_PROMPT,
} from '../prompts/ai-report-prompt';

export async function analyzeWithMistralVision(
  images: PageImage[]
): Promise<VisionAnalysisResult> {
  const startTime = Date.now();
  console.log('[Mistral Vision] ========================================');
  console.log('[Mistral Vision] Starting TWO-LAYER analysis');
  console.log('[Mistral Vision] Pages:', images.length);
  console.log('[Mistral Vision] Total size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    console.error('[Mistral Vision] MISTRAL_API_KEY not configured');
    return createEmptyResult('mistral', 'MISTRAL_API_KEY not configured', Date.now() - startTime, images.length);
  }

  try {
    // ================================================================
    // LAYER 1: VISION EXTRACTION - Get ALL text from images
    // ================================================================
    console.log('[Mistral Vision] === LAYER 1: Vision Extraction ===');

    const visionContent: any[] = [];

    for (const img of images) {
      visionContent.push({
        type: 'image_url',
        image_url: `data:${img.mimeType};base64,${img.base64}`,
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

    console.log('[Mistral Vision] Sending vision extraction request to pixtral-large-latest...');

    const visionResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'pixtral-large-latest',
        messages: [
          {
            role: 'system',
            content: VISION_EXTRACTION_SYSTEM,
          },
          {
            role: 'user',
            content: visionContent,
          },
        ],
        max_tokens: 8000,
        temperature: 0.2,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('[Mistral Vision] API Error:', visionResponse.status, errorText);
      throw new Error(`Mistral API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const rawExtraction = visionData.choices?.[0]?.message?.content;

    if (!rawExtraction || typeof rawExtraction !== 'string') {
      throw new Error('No text response from Mistral vision extraction');
    }

    const layer1Duration = Date.now() - startTime;

    console.log(`[Mistral Vision] Layer 1 complete in ${layer1Duration}ms`);
    console.log(`[Mistral Vision] Extracted ${rawExtraction.length} characters`);
    console.log('[Mistral Vision] Preview:', rawExtraction.substring(0, 300));

    // ================================================================
    // LAYER 2: AI REPORT - Create structured report from extraction
    // ================================================================
    console.log('[Mistral Vision] === LAYER 2: AI Report Generation ===');

    const reportPrompt = AI_REPORT_PROMPT.replace('{visionExtraction}', rawExtraction);

    console.log('[Mistral Vision] Sending report generation request...');

    const reportResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: AI_REPORT_SYSTEM,
          },
          {
            role: 'user',
            content: reportPrompt,
          },
        ],
        max_tokens: 4096,
        temperature: 0.2,
      }),
    });

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      console.error('[Mistral Vision] Report API Error:', reportResponse.status, errorText);
      throw new Error(`Mistral report API error: ${reportResponse.status}`);
    }

    const reportData = await reportResponse.json();
    const reportText = reportData.choices?.[0]?.message?.content;

    if (!reportText || typeof reportText !== 'string') {
      throw new Error('No text response from Mistral report generation');
    }

    const durationMs = Date.now() - startTime;
    const layer2Duration = durationMs - layer1Duration;

    console.log(`[Mistral Vision] Layer 2 complete in ${layer2Duration}ms`);
    console.log(`[Mistral Vision] Total duration: ${durationMs}ms`);

    // Parse JSON from response
    const jsonMatch = reportText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Mistral Vision] No JSON found in report response');
      console.error('[Mistral Vision] Response preview:', reportText.substring(0, 500));
      throw new Error('Invalid response format - no JSON found in report');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log('[Mistral Vision] ✓ Grade:', parsed.grade?.value || 'NOT FOUND');
    console.log('[Mistral Vision] ✓ Confidence:', parsed.grade?.confidence);
    console.log('[Mistral Vision] ✓ Student:', parsed.student?.name || 'NOT FOUND');
    console.log('[Mistral Vision] ✓ Subject:', parsed.test?.subject || 'NOT FOUND');
    console.log('[Mistral Vision] ✓ Strengths:', parsed.strengths?.length || 0);
    console.log('[Mistral Vision] ✓ Weaknesses:', parsed.weaknesses?.length || 0);
    console.log('[Mistral Vision] ✓ Recommendations:', parsed.recommendations?.length || 0);

    return {
      provider: 'mistral',
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
    console.error('[Mistral Vision] ✗ Error:', error);
    return createEmptyResult('mistral', error instanceof Error ? error.message : 'Unknown error', durationMs, images.length);
  }
}
