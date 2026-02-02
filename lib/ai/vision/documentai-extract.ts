import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { ensureGoogleCreds } from '../../write-google-creds';

interface PageImage {
  base64: string;
  mimeType: string;
  pageNumber: number;
}

export async function extractWithDocumentAI(images: PageImage[]) {
  const startTime = Date.now();
  console.log('[Document AI] Starting extraction...');
  console.log('[Document AI] Pages:', images.length);

  // Ensure Google credentials are available
  ensureGoogleCreds();

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us';
  const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;

  if (!projectId || !processorId) {
    return {
      success: false as const,
      error: 'GOOGLE_CLOUD_PROJECT_ID and GOOGLE_DOCUMENT_AI_PROCESSOR_ID required',
      extraction: '',
      duration: 0,
      provider: 'documentai' as const,
      confidence: 0,
    };
  }

  try {
    const client = new DocumentProcessorServiceClient();

    // Process each page and combine results
    const extractions: string[] = [];
    let totalConfidence = 0;
    let pageCount = 0;

    for (const img of images) {
      console.log(`[Document AI] Processing page ${img.pageNumber}...`);

      const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

      const request = {
        name,
        rawDocument: {
          content: img.base64,
          mimeType: img.mimeType,
        },
      };

      const [result] = await client.processDocument(request);
      const { document } = result;

      if (!document) {
        throw new Error('No document returned from Document AI');
      }

      // Extract text content
      const textContent = document.text || '';

      // Calculate confidence from text anchor confidence scores
      let pageConfidence = 0;
      let confidenceCount = 0;

      if (document.pages) {
        for (const page of document.pages) {
          if (page.blocks) {
            for (const block of page.blocks) {
              if (block.layout && block.layout.confidence) {
                pageConfidence += block.layout.confidence;
                confidenceCount++;
              }
            }
          }
        }
      }

      const avgPageConfidence = confidenceCount > 0 ? pageConfidence / confidenceCount : 0;
      totalConfidence += avgPageConfidence;
      pageCount++;

      console.log(`[Document AI] Page ${img.pageNumber} confidence: ${(avgPageConfidence * 100).toFixed(1)}%`);

      extractions.push(`PAGE ${img.pageNumber}:\n${textContent}\n---`);
    }

    const extraction = extractions.join('\n\n');
    const avgConfidence = pageCount > 0 ? totalConfidence / pageCount : 0;

    const duration = Date.now() - startTime;
    console.log('[Document AI] Complete');
    console.log('[Document AI] Characters:', extraction.length);
    console.log('[Document AI] Average confidence:', (avgConfidence * 100).toFixed(1) + '%');
    console.log('[Document AI] Time:', duration, 'ms');

    return {
      success: true as const,
      extraction,
      duration,
      provider: 'documentai' as const,
      confidence: avgConfidence,
    };

  } catch (error: any) {
    console.error('[Document AI] Error:', error.message);
    return {
      success: false as const,
      error: error.message,
      extraction: '',
      duration: Date.now() - startTime,
      provider: 'documentai' as const,
      confidence: 0,
    };
  }
}