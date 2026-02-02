import { GoogleGenerativeAI } from '@google/generative-ai';

const EXTRACTION_PROMPT = `Extract ALL content from this German school test.

For each page, extract:
1. ALL printed text (exactly as written)
2. ALL handwriting (student = blue/black, teacher = red/pink)
3. ALL marks and symbols (R, Z, Gr, A, check marks, etc.)
4. Grade information (Note, points, percentages)
5. Names and dates
6. Teacher comments (main feedback + margin notes)

Format:
---
PAGE 1:
Type: [page type]
Printed text: [all text]
Student writing: [handwriting]
Teacher writing (red): [teacher marks and comments]
Marks: [correction symbols]
Grade found: [if any]
Names/Dates: [if any]
---
PAGE 2:
[continue...]
---

Be thorough. Extract EVERYTHING. Miss nothing.`;

export async function extractWithGemini(images: Array<{base64: string, mimeType: string, pageNumber: number}>) {
  const startTime = Date.now();
  console.log('[Gemini Extract] Starting extraction...');
  console.log('[Gemini Extract] Pages:', images.length);

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false as const,
      error: 'GOOGLE_API_KEY not configured',
      extraction: '',
      duration: 0,
      provider: 'gemini' as const,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build parts array with images
    const parts: any[] = [];

    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
      parts.push({ text: `[Page ${img.pageNumber}]` });
    }

    parts.push({ text: EXTRACTION_PROMPT });

    console.log('[Gemini Extract] Sending request...');

    const result = await model.generateContent(parts);
    const response = await result.response;
    const extraction = response.text();

    const duration = Date.now() - startTime;
    console.log('[Gemini Extract] Complete');
    console.log('[Gemini Extract] Characters:', extraction.length);
    console.log('[Gemini Extract] Time:', duration, 'ms');

    return {
      success: true as const,
      extraction,
      duration,
      provider: 'gemini' as const,
    };

  } catch (error: any) {
    console.error('[Gemini Extract] Error:', error.message);
    return {
      success: false as const,
      error: error.message,
      extraction: '',
      duration: Date.now() - startTime,
      provider: 'gemini' as const,
    };
  }
}
