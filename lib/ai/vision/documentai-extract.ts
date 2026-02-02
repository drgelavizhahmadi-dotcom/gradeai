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

  console.log('[Document AI] Config check:');
  console.log('[Document AI] - Project ID:', projectId ? 'SET' : 'MISSING');
  console.log('[Document AI] - Location:', location);
  console.log('[Document AI] - Processor ID:', processorId ? 'SET' : 'MISSING');

  if (!projectId || !processorId) {
    const missing = [];
    if (!projectId) missing.push('GOOGLE_CLOUD_PROJECT_ID');
    if (!processorId) missing.push('GOOGLE_DOCUMENT_AI_PROCESSOR_ID');
    return {
      success: false as const,
      error: `Missing required environment variables: ${missing.join(', ')}`,
      extraction: '',
      duration: 0,
      provider: 'documentai' as const,
      confidence: 0,
    };
  }

  try {
    console.log('[Document AI] Initializing Document AI client...');
    const client = new DocumentProcessorServiceClient();
    console.log('[Document AI] Client initialized successfully');

    // Process each page and combine results
    const extractions: string[] = [];
    let totalConfidence = 0;
    let pageCount = 0;

    for (const img of images) {
      console.log(`[Document AI] Processing page ${img.pageNumber}...`);
      console.log(`[Document AI] Image size: ${img.base64.length} bytes`);
      console.log(`[Document AI] MIME type: ${img.mimeType}`);

      // Clean base64 content (remove data URL prefix if present)
      let cleanBase64 = img.base64;
      if (img.base64.includes(',')) {
        cleanBase64 = img.base64.split(',')[1];
        console.log(`[Document AI] Cleaned base64 (removed data URL prefix), new size: ${cleanBase64.length} bytes`);
      }

      const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
      console.log(`[Document AI] Processor name: ${name}`);

      const request = {
        name,
        rawDocument: {
          content: cleanBase64,
          mimeType: img.mimeType,
        },
      };

      console.log(`[Document AI] Sending request to Document AI...`);
      const [result] = await client.processDocument(request);
      console.log(`[Document AI] Received response from Document AI`);

      const { document } = result;

      if (!document) {
        throw new Error('No document returned from Document AI');
      }

      // Extract text content
      const textContent = document.text || '';

      // Calculate confidence - check multiple levels
      let pageConfidence = 0;
      let confidenceCount = 0;

      if (document.pages && document.pages.length > 0) {
        for (const page of document.pages) {
          // Try page-level confidence first
          if (page.layout?.confidence !== undefined && page.layout?.confidence !== null) {
            pageConfidence += page.layout.confidence;
            confidenceCount++;
            console.log(`[Document AI] Found page-level confidence: ${(page.layout.confidence * 100).toFixed(1)}%`);
          }
          // Try block-level confidence
          else if (page.blocks) {
            for (const block of page.blocks) {
              if (block.layout?.confidence !== undefined && block.layout?.confidence !== null) {
                pageConfidence += block.layout.confidence;
                confidenceCount++;
                console.log(`[Document AI] Found block-level confidence: ${(block.layout.confidence * 100).toFixed(1)}%`);
              }
            }
          }
          // Try paragraph-level confidence
          else if (page.paragraphs) {
            for (const paragraph of page.paragraphs) {
              if (paragraph.layout?.confidence !== undefined && paragraph.layout?.confidence !== null) {
                pageConfidence += paragraph.layout.confidence;
                confidenceCount++;
                console.log(`[Document AI] Found paragraph-level confidence: ${(paragraph.layout.confidence * 100).toFixed(1)}%`);
              }
            }
          }
          // Try line-level confidence
          else if (page.lines) {
            for (const line of page.lines) {
              if (line.layout?.confidence !== undefined && line.layout?.confidence !== null) {
                pageConfidence += line.layout.confidence;
                confidenceCount++;
                console.log(`[Document AI] Found line-level confidence: ${(line.layout.confidence * 100).toFixed(1)}%`);
              }
            }
          }
        }
      }

      // Check document-level confidence from textChanges
      if (document.textChanges) {
        for (const change of document.textChanges) {
          // Note: textChanges might not have confidence, this is for future compatibility
          if ((change as any).confidence !== undefined && (change as any).confidence !== null) {
            pageConfidence += (change as any).confidence;
            confidenceCount++;
            console.log(`[Document AI] Found text-change confidence: ${((change as any).confidence * 100).toFixed(1)}%`);
          }
        }
      }

      // Fallback: if no confidence found, assume high confidence for successful extraction
      const avgPageConfidence = confidenceCount > 0 ? pageConfidence / confidenceCount : (textContent.length > 0 ? 0.95 : 0);

      console.log(`[Document AI] Confidence calculation: found ${confidenceCount} confidence values, average: ${(avgPageConfidence * 100).toFixed(1)}%`);

      totalConfidence += avgPageConfidence;
      pageCount++;

      console.log(`[Document AI] Page ${img.pageNumber} confidence: ${(avgPageConfidence * 100).toFixed(1)}%`);
      console.log(`[Document AI] Text length: ${textContent.length} characters`);

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