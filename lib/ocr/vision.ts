import vision from '@google-cloud/vision'
import pdfParse from 'pdf-parse'
import type { ParsedTestData } from './types'

let client: vision.ImageAnnotatorClient | null = null

function initializeVisionClient() {
  if (client) return client

  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!credentialsJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set')
  }

  try {
    // Parse credentials from JSON string
    const credentials = typeof credentialsJson === 'string' 
      ? JSON.parse(credentialsJson) 
      : credentialsJson

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
  // Check if it's a PDF by looking for PDF file signature
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

  // First annotation contains the full text
  return detections[0].description || ''
}

/**
 * Extracts text from a PDF using pdf-parse
 * Note: pdf-to-png-converter doesn't work in serverless, so we only support text PDFs
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    // Parse PDF and extract text
    const pdfData = await pdfParse(pdfBuffer)
    const extractedText = pdfData.text

    // If we got text, return it
    if (extractedText && extractedText.trim().length > 0) {
      return extractedText
    }

    // For image-based PDFs in serverless, we can't process them
    // Log a warning and return empty string
    console.warn('[OCR] PDF appears to be image-based. Image-based PDFs are not supported in production.')
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

  const gradeMatch = text.match(gradePattern)
  const subjectMatch = text.match(subjectPattern)

  return {
    grade: gradeMatch ? gradeMatch[1].trim() : null,
    subject: subjectMatch ? subjectMatch[1].trim() : null,
    rawText: text,
  }
}