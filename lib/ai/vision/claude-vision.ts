import Anthropic from '@anthropic-ai/sdk';
import { PageImage, VisionAnalysisResult, createEmptyResult } from './types';
import { VISION_ANALYSIS_PROMPT, VISION_SYSTEM_PROMPT } from '../prompts/vision-prompt';

export async function analyzeWithClaudeVision(
  images: PageImage[]
): Promise<VisionAnalysisResult> {
  const startTime = Date.now();
  console.log('[Claude Vision] ========================================');
  console.log('[Claude Vision] Starting analysis');
  console.log('[Claude Vision] Pages:', images.length);
  console.log('[Claude Vision] Total size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[Claude Vision] ANTHROPIC_API_KEY not configured');
    return createEmptyResult('claude', 'ANTHROPIC_API_KEY not configured', Date.now() - startTime, images.length);
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    // Build message content with all images
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    for (const img of images) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mimeType,
          data: img.base64,
        },
      });
      content.push({
        type: 'text',
        text: `[Page ${img.pageNumber} of ${images.length}]`,
      });
    }

    content.push({
      type: 'text',
      text: VISION_ANALYSIS_PROMPT,
    });

    console.log('[Claude Vision] Sending request to claude-sonnet-4-20250514...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: VISION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const durationMs = Date.now() - startTime;
    console.log(`[Claude Vision] Response received in ${durationMs}ms`);

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Claude Vision] No JSON found in response');
      console.error('[Claude Vision] Response preview:', textContent.text.substring(0, 500));
      throw new Error('Invalid response format - no JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log('[Claude Vision] ✓ Grade:', parsed.grade?.value || 'NOT FOUND');
    console.log('[Claude Vision] ✓ Confidence:', parsed.grade?.confidence);
    console.log('[Claude Vision] ✓ Student:', parsed.student?.name || 'NOT FOUND');
    console.log('[Claude Vision] ✓ Subject:', parsed.test?.subject || 'NOT FOUND');

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
        rawResponse: textContent.text.substring(0, 500),
      },
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Claude Vision] ✗ Error:', error);
    return createEmptyResult('claude', error instanceof Error ? error.message : 'Unknown error', durationMs, images.length);
  }
}
