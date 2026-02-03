import { extractTextFromImage } from '../../ocr/vision';

interface PageImage {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

export async function extractWithVisionOCR(images: PageImage[]) {
  const startTime = Date.now();
  console.log('[Vision OCR] Starting extraction...');
  console.log('[Vision OCR] Pages:', images.length);

  try {
    const extractions: string[] = [];
    let totalConfidence = 0;

    for (const img of images) {
      console.log(`[Vision OCR] Processing page ${img.pageNumber}...`);

      // Convert base64 to Buffer
      let base64Data = img.base64;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      const buffer = Buffer.from(base64Data, 'base64');

      const { text, confidence } = await extractTextFromImage(buffer);
      totalConfidence += confidence;

      console.log(`[Vision OCR] Page ${img.pageNumber}: ${text.length} chars, confidence: ${(confidence * 100).toFixed(1)}%`);
      extractions.push(`PAGE ${img.pageNumber}:\n${text}\n---`);
    }

    const extraction = extractions.join('\n\n');
    const avgConfidence = images.length > 0 ? totalConfidence / images.length : 0;
    const duration = Date.now() - startTime;

    console.log('[Vision OCR] Complete');
    console.log('[Vision OCR] Characters:', extraction.length);
    console.log('[Vision OCR] Average confidence:', (avgConfidence * 100).toFixed(1) + '%');
    console.log('[Vision OCR] Time:', duration, 'ms');

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
