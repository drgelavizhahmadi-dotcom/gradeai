import vision from '@google-cloud/vision'
import { pdf } from 'pdf-parse'
import { convert } from 'pdf-to-png-converter'
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
 * Extracts text from a PDF
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    // Try direct PDF text extraction first
    const pdfData = await pdf(pdfBuffer)
    const extractedText = pdfData.text

    // If we got substantial text, return it
    if (extractedText && extractedText.trim().length > 100) {
      return extractedText
    }

    // Otherwise, fall back to OCR (image-based PDF)
    console.log('[OCR] PDF text extraction yielded minimal text, falling back to OCR...')
    return extractTextFromPdfWithOcr(pdfBuffer)
  } catch (error) {
    console.log('[OCR] PDF parsing failed, attempting OCR approach:', error)
    return extractTextFromPdfWithOcr(pdfBuffer)
  }
}

/**
 * Extracts text from a PDF by converting pages to images and running OCR
 */
async function extractTextFromPdfWithOcr(pdfBuffer: Buffer): Promise<string> {
  const pages = await convert({
    fileBuffer: pdfBuffer,
    pagesToProcess: [],
    outputType: 'image/png',
  })

  let combinedText = ''

  for (let i = 0; i < pages.length; i++) {
    const pageImage = pages[i]
    const pageText = await extractTextFromImage(pageImage.png)
    combinedText += pageText
    if (i < pages.length - 1) {
      combinedText += '\n--- Page Break ---\n'
    }
  }

  return combinedText
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