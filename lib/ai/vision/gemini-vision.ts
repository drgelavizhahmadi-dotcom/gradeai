import { GoogleGenerativeAI } from '@google/generative-ai';
import { PageImage, VisionAnalysisResult, createEmptyResult } from './types';
import { VISION_ANALYSIS_PROMPT, VISION_SYSTEM_PROMPT } from '../prompts/vision-prompt';

export async function analyzeWithGeminiVision(
  images: PageImage[]
): Promise<VisionAnalysisResult> {
  const startTime = Date.now();
  console.log('[Gemini Vision] ========================================');
  console.log('[Gemini Vision] Starting analysis');
  console.log('[Gemini Vision] Pages:', images.length);
  console.log('[Gemini Vision] Total size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Gemini Vision] GOOGLE_API_KEY not configured');
    return createEmptyResult('gemini', 'GOOGLE_API_KEY not configured', Date.now() - startTime, images.length);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: VISION_SYSTEM_PROMPT,
    });

    // Build parts with images
    const parts: any[] = [];

    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
      parts.push({ text: `[Page ${img.pageNumber} of ${images.length}]` });
    }

    parts.push({ text: VISION_ANALYSIS_PROMPT });

    console.log('[Gemini Vision] Sending request to gemini-2.0-flash...');

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    const durationMs = Date.now() - startTime;
    console.log(`[Gemini Vision] Response received in ${durationMs}ms`);

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Gemini Vision] No JSON found in response');
      console.error('[Gemini Vision] Response preview:', text.substring(0, 500));
      throw new Error('Invalid response format - no JSON found');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log('[Gemini Vision] ✓ Grade:', parsed.grade?.value || 'NOT FOUND');
    console.log('[Gemini Vision] ✓ Confidence:', parsed.grade?.confidence);
    console.log('[Gemini Vision] ✓ Student:', parsed.student?.name || 'NOT FOUND');
    console.log('[Gemini Vision] ✓ Subject:', parsed.test?.subject || 'NOT FOUND');

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
        rawResponse: text.substring(0, 500),
      },
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Gemini Vision] ✗ Error:', error);
    return createEmptyResult('gemini', error instanceof Error ? error.message : 'Unknown error', durationMs, images.length);
  }
}
