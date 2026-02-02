import { GoogleGenerativeAI } from '@google/generative-ai';

const EXTRACTION_PROMPT = `Extract ALL content from this German school test.

For each page, extract:
1. ALL printed text (exactly as written)
2. ALL handwriting (student = blue/black ink, teacher = red/pink ink)
3. ALL marks and symbols (R, Z, Gr, A, check marks, etc.)
4. Grade information (Note, points, percentages)
5. Names and dates
6. Teacher comments (main feedback + margin notes)

Format:
---
PAGE 1:
Type: [page type]
Printed text: [all text]
Student writing (blue/black): [handwriting]
Teacher writing (red/pink): [teacher marks]
Correction marks: [R, Gr, Z, A with counts]
Grade found: [if any]
Names/Dates: [if any]
---
PAGE 2:
[continue...]
---

Extract EVERYTHING. Miss nothing.`;

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.message?.includes('Resource exhausted');

      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[Gemini] Rate limited, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

interface PageImage {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

export async function extractWithGemini(images: PageImage[]) {
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

    console.log('[Gemini Extract] Sending request (with retry)...');

    const result = await retryWithBackoff(async () => {
      return await model.generateContent(parts);
    }, 3, 2000);

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
