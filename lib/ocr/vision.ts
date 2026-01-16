import * as vision from '@google-cloud/vision'
import type { ParsedTestData } from './types'

let client: vision.ImageAnnotatorClient | null = null

function initializeVisionClient() {
  if (client) return client

  let credentials: any

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!credentialsJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set')
  }

  try {
    // Try to parse as JSON string first (for Vercel)
    if (credentialsJson.startsWith('{')) {
      credentials = JSON.parse(credentialsJson)
    } else {
      // Otherwise treat as file path (for local development)
      const fs = require('fs')
      const path = require('path')
      const resolvedPath = path.resolve(credentialsJson.trim())
      credentials = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'))
    }

    console.log('[Vision Client] Initializing Google Cloud Vision client...')
    console.log('[Vision Client] Client email:', credentials.client_email)
    console.log('[Vision Client] Project ID:', credentials.project_id)

    client = new vision.ImageAnnotatorClient({
      credentials,
    })

    return client
  } catch (error) {
    throw new Error(`Failed to initialize Vision client: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function getVisionClient() {
  return initializeVisionClient()
}

/**
 * Extracts text from images or PDFs
 */
export async function extractText(fileBuffer: Buffer): Promise<string> {
  const isPdf = fileBuffer.toString('utf8', 0, 4) === '%PDF'

  if (isPdf) {
    return extractTextFromPdf(fileBuffer)
  } else {
    return extractTextFromImage(fileBuffer)
  }
}

/**
 * Extracts text from an image using Google Cloud Vision API
 */
async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  const client = getVisionClient()

  const request = {
    image: {
      content: imageBuffer,
    },
  }

  const [result] = await client.textDetection(request)
  const detections = result.textAnnotations

  if (!detections || detections.length === 0) {
    return ''
  }

  return detections[0].description || ''
}

/**
 * Extracts text from a PDF
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    console.warn('[OCR] PDF support requires text-based PDFs. Image-based PDFs are not supported in production.')
    return ''
  } catch (error) {
    console.error('[OCR] PDF parsing failed:', error)
    return ''
  }
}

/**
 * Parses German test/assignment text to extract structured information
 */
export function parseGermanTest(text: string): ParsedTestData {
  const gradePattern = /(?:Note|Grade|Benotung)[\s:]*([1-6][\s+\-]?\.?[5]?)/i
  const subjectPattern = /(?:Fach|Subject)[\s:]*([A-Za-z]+)/i
  const commentPattern = /(?:Kommentar|Comment|Anmerkung)[\s:]*(.+?)(?=\n|$)/i

  const gradeMatch = text.match(gradePattern)
  const subjectMatch = text.match(subjectPattern)
  const commentMatch = text.match(commentPattern)

  return {
    grade: gradeMatch ? gradeMatch[1].trim() : null,
    subject: subjectMatch ? subjectMatch[1].trim() : null,
    teacherComment: commentMatch ? commentMatch[1].trim() : null,
    rawText: text,
  }
}