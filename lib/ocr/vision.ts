
// Vercel Google credentials workaround
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  // Use dynamic import for fs and path to avoid issues in edge runtimes
  // Only run in Node.js
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path');
    const credsPath = path.join('/tmp', 'google-credentials.json');
    fs.writeFileSync(credsPath, process.env.GOOGLE_CREDENTIALS_JSON);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  } catch (e) {
    // Ignore if not in Node.js
  }
}

// Import DOMMatrix polyfill FIRST - must be before pdfjs-dist
import './dommatrix-polyfill';

import sharp from 'sharp'
import vision from '@google-cloud/vision';
import * as pdfjsLib from 'pdfjs-dist';
import type { ParsedTestData } from './types';

const client = new vision.ImageAnnotatorClient();

/**
 * Extracts text from an image buffer using Google Cloud Vision API.
 * @param imageBuffer - The image buffer to process.
 * @returns A promise resolving to an object containing the extracted text and confidence score.
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  try {
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return { text: '', confidence: 0 };
    }

    return { text: detections[0].description || '', confidence: detections[0].score || 0 };
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

// Configure PDF.js worker (required for Node.js)
if (typeof window === 'undefined') {
  // Node.js environment - disable worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''
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
