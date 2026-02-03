import { extractTextFromImage } from '../../ocr/vision';

interface PageImage {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

export async function extractWithVisionOCR(images: PageImage[]) {
  const startTime = Date.now();
  console.log('[Vision OCR] Starting parallel extraction...');
  console.log('[Vision OCR] Pages:', images.length);

  try {
    // Process ALL pages in parallel for maximum speed
    const pagePromises = images.map(async (img) => {
      let base64Data = img.base64;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      const buffer = Buffer.from(base64Data, 'base64');

      const { text, confidence } = await extractTextFromImage(buffer);
      return { pageNumber: img.pageNumber, text, confidence };
    });

    const results = await Promise.all(pagePromises);

    // Sort by page number and combine
    results.sort((a, b) => a.pageNumber - b.pageNumber);

    let totalConfidence = 0;
    const extractions: string[] = [];

    for (const { pageNumber, text, confidence } of results) {
      totalConfidence += confidence;
      extractions.push(`=== SEITE ${pageNumber} ===\n${text}`);
      console.log(`[Vision OCR] Page ${pageNumber}: ${text.length} chars, ${(confidence * 100).toFixed(0)}%`);
    }

    const extraction = extractions.join('\n\n');
    const avgConfidence = images.length > 0 ? totalConfidence / images.length : 0;
    const duration = Date.now() - startTime;

    console.log('[Vision OCR] Done:', extraction.length, 'chars in', duration, 'ms');

    return {
      success: true as const,
      extraction,
      duration,
      provider: 'vision-ocr' as const,
      confidence: avgConfidence,
    };
  } catch (error: any) {
    console.error('[Vision OCR] Error:', error.message);
    return {
      success: false as const,
      error: error.message,
      extraction: '',
      duration: Date.now() - startTime,
      provider: 'vision-ocr' as const,
      confidence: 0,
    };
  }
}
