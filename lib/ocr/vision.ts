console.log('[Vision] Module loading...');

// Vercel Google credentials workaround
// Support multiple environment variable names and base64-encoded values.
// Prefer raw JSON env vars but accept base64 one-liners as well.
const rawJsonEnv = process.env.GOOGLE_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
const b64Env = process.env.GOOGLE_CREDENTIALS_B64 || process.env.GOOGLE_APPLICATION_CREDENTIALS_B64;
console.log('[Vision] Credentials env check:', {
  hasRawJson: !!rawJsonEnv,
  hasB64: !!b64Env,
  rawJsonLength: rawJsonEnv?.length || 0,
});
if (rawJsonEnv || b64Env) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path');

    let jsonText: string | null = null;

    if (rawJsonEnv) {
      jsonText = rawJsonEnv;
      console.log('[Vision] Using raw JSON credentials');
    } else if (b64Env) {
      try {
        jsonText = Buffer.from(b64Env, 'base64').toString('utf8');
        console.log('[Vision] Decoded base64 credentials');
      } catch (err) {
        console.warn('[Vision] Failed to decode base64 credentials:', err);
        // If decoding fails, leave jsonText null and let validation below handle it
        jsonText = null;
      }
    }

    // Validate JSON before writing
    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        console.log('[Vision] Credentials JSON valid, project_id:', parsed.project_id);
        const credsPath = path.join('/tmp', 'google-credentials.json');
        fs.writeFileSync(credsPath, jsonText, { encoding: 'utf8', mode: 0o600 });
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
        console.log('[Vision] Wrote credentials to:', credsPath);
      } catch (err) {
        console.error('[Vision] Invalid credentials JSON:', err);
        // Invalid JSON - do not write credentials or expose secret
        // Let the caller handle missing credentials
      }
    }
  } catch (e) {
    console.warn('[Vision] Credential setup error:', e);
    // Ignore if not in Node.js or other runtime issues
  }
} else {
  console.log('[Vision] No credentials env vars found, relying on GOOGLE_APPLICATION_CREDENTIALS file');
}

// Import DOMMatrix polyfill FIRST - must be before pdfjs-dist
import './dommatrix-polyfill.ts';

import * as sharp from 'sharp'
import vision from '@google-cloud/vision';
import type { ParsedTestData } from './types';

const VISION_TIMEOUT_MS = 15000; // 15 second timeout for Vision API calls

console.log('[Vision] Creating ImageAnnotatorClient...');
const clientStartTime = Date.now();
const client = new vision.ImageAnnotatorClient();
console.log(`[Vision] ImageAnnotatorClient created in ${Date.now() - clientStartTime}ms`);

/**
 * Extracts text from an image buffer using Google Cloud Vision API.
 * @param imageBuffer - The image buffer to process.
 * @returns A promise resolving to an object containing the extracted text and confidence score.
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  // Check if this is a PDF file
  const isPDF = imageBuffer.length >= 4 && imageBuffer.subarray(0, 4).toString() === '%PDF';
  
  if (isPDF) {
    throw new Error('PDF files are not supported. Please convert to image format (PNG/JPG) first.');
  }

  // Wrap the Vision API call with a proper timeout to prevent hanging
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Google Vision API timeout after ${VISION_TIMEOUT_MS}ms`)), VISION_TIMEOUT_MS);
  });

  try {
    console.log('[Vision] Starting text detection...');
    const startTime = Date.now();

    const [result] = await Promise.race([
      client.textDetection(imageBuffer),
      timeoutPromise,
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`[Vision] Text detection completed in ${elapsed}ms`);

    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      console.log('[Vision] No text detected in image');
      return { text: '', confidence: 0 };
    }

    console.log(`[Vision] Detected ${detections.length} text annotations, ${detections[0].description?.length || 0} chars`);
    
    // Calculate confidence from individual text annotations (skip the first one which is the full text)
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    // Skip the first annotation (full text) and calculate average confidence from individual words/lines
    for (let i = 1; i < detections.length; i++) {
      const detection = detections[i];
      // Use score or confidence property, whichever is available and valid
      const conf = detection.confidence || detection.score;
      if (typeof conf === 'number' && conf >= 0 && conf <= 1) {
        totalConfidence += conf;
        confidenceCount++;
      }
    }
    
    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    
    // If Google Vision successfully extracted text but didn't provide confidence scores,
    // assume high confidence since the extraction worked
    const finalConfidence = averageConfidence > 0 ? averageConfidence : (detections[0].description ? 0.9 : 0);
    
    console.log(`[Vision] Confidence: ${(finalConfidence * 100).toFixed(1)}% (${confidenceCount} elements with scores)`);
    
    return { text: detections[0].description || '', confidence: finalConfidence };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Vision] Error extracting text:', errorMsg);
    throw error;
  }
}

export function parseGermanTest(text: string): ParsedTestData {
  // Placeholder implementation for parsing German test data
  return {
    grade: 'N/A',
    subject: 'Unknown',
    teacherComment: 'Placeholder',
    rawText: text,
  };
}
