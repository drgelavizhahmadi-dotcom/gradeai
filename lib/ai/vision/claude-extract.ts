import Anthropic from '@anthropic-ai/sdk';

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

interface PageImage {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

export async function extractWithClaude(images: PageImage[]) {
  const startTime = Date.now();
  console.log('[Claude Extract] Starting extraction (fallback)...');
  console.log('[Claude Extract] Pages:', images.length);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false as const,
      error: 'ANTHROPIC_API_KEY not configured',
      extraction: '',
      duration: 0,
      provider: 'claude' as const,
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const content: any[] = [];

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
        text: `[Page ${img.pageNumber}]`,
      });
    }

    content.push({
      type: 'text',
      text: EXTRACTION_PROMPT,
    });

    console.log('[Claude Extract] Sending request...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const extraction = textContent?.type === 'text' ? textContent.text : '';

    const duration = Date.now() - startTime;
    console.log('[Claude Extract] Complete');
    console.log('[Claude Extract] Characters:', extraction.length);
    console.log('[Claude Extract] Time:', duration, 'ms');

    return {
      success: true as const,
      extraction,
      duration,
      provider: 'claude' as const,
    };

  } catch (error: any) {
    console.error('[Claude Extract] Error:', error.message);
    return {
      success: false as const,
      error: error.message,
      extraction: '',
      duration: Date.now() - startTime,
      provider: 'claude' as const,
    };
  }
}
