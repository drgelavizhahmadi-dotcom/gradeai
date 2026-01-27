import { PageImage, VisionAnalysisResult, createEmptyResult } from './types';
import { VISION_ANALYSIS_PROMPT, VISION_SYSTEM_PROMPT } from '../prompts/vision-prompt';

export async function analyzeWithMistralVision(
  images: PageImage[]
): Promise<VisionAnalysisResult> {
  const startTime = Date.now();
  console.log('[Mistral Vision] ========================================');
  console.log('[Mistral Vision] Starting analysis');
  console.log('[Mistral Vision] Pages:', images.length);
  console.log('[Mistral Vision] Total size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    console.error('[Mistral Vision] MISTRAL_API_KEY not configured');
    return createEmptyResult('mistral', 'MISTRAL_API_KEY not configured', Date.now() - startTime, images.length);
  }

  try {
    // Build content with images for Pixtral
    const content: any[] = [];

    for (const img of images) {
      content.push({
        type: 'image_url',
        image_url: `data:${img.mimeType};base64,${img.base64}`,
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

    console.log('[Mistral Vision] Sending request to pixtral-large-latest...');

    // Use fetch API for Mistral (more reliable than SDK for vision)
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
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
            content: VISION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content,
          },
        ],
        max_tokens: 4096,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Mistral Vision] API Error:', response.status, errorText);
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    const durationMs = Date.now() - startTime;
    console.log(`[Mistral Vision] Response received in ${durationMs}ms`);

    const text = data.choices?.[0]?.message?.content;
    if (!text || typeof text !== 'string') {
      throw new Error('No text response from Mistral');
    }

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Mistral Vision] No JSON found in response');
      console.error('[Mistral Vision] Response preview:', text.substring(0, 500));
      throw new Error('Invalid response format - no JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log('[Mistral Vision] ✓ Grade:', parsed.grade?.value || 'NOT FOUND');
    console.log('[Mistral Vision] ✓ Confidence:', parsed.grade?.confidence);
    console.log('[Mistral Vision] ✓ Student:', parsed.student?.name || 'NOT FOUND');
    console.log('[Mistral Vision] ✓ Subject:', parsed.test?.subject || 'NOT FOUND');

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
        rawResponse: text.substring(0, 500),
      },
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Mistral Vision] ✗ Error:', error);
    return createEmptyResult('mistral', error instanceof Error ? error.message : 'Unknown error', durationMs, images.length);
  }
}
