// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import vision from '@google-cloud/vision'
import fs from 'fs'
import path from 'path'

// Get credentials file path from environment
const rawCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

// Validate environment variable is set
if (!rawCredentialsPath) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set')
}

// Normalize the path for Windows compatibility and trim any whitespace
const credentialsPath = path.resolve(rawCredentialsPath.trim())
console.log('[Vision Client] Initializing Google Cloud Vision client...')
console.log('[Vision Client] Using credentials:', credentialsPath)

// Read and parse credentials file
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'))

console.log('[Vision Client] Credentials loaded successfully')
console.log('[Vision Client] Client email:', credentials.client_email)
console.log('[Vision Client] Project ID:', credentials.project_id)

// Initialize the Google Cloud Vision client with credentials object
const client = new vision.ImageAnnotatorClient({
  credentials: credentials,
})

console.log('[Vision Client] Client initialized successfully')

/**
 * Detects if buffer is a PDF file
 * @param buffer - File buffer
 * @returns True if PDF, false otherwise
 */
function isPDF(buffer: Buffer): boolean {
  // PDF files start with "%PDF-"
  return buffer.subarray(0, 5).toString() === '%PDF-'
}


/**
 * Extracts text from an image buffer using Google Cloud Vision API
 * @param imageBuffer - The image file buffer
 * @returns The extracted text content
 */
async function extractTextFromImageBuffer(imageBuffer: Buffer): Promise<string> {
  console.log('[OCR] Starting Vision API text extraction...')
  console.log(`[OCR] Buffer size: ${(imageBuffer.length / 1024).toFixed(2)} KB`)

  try {
    console.log('[OCR] Calling Google Cloud Vision API...')

    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    })

    const detections = result.textAnnotations

    if (!detections || detections.length === 0) {
      console.log('[OCR] No text detected in image')
      return ''
    }

    // The first annotation contains the entire detected text
    const fullText = detections[0].description || ''

    console.log(`[OCR] Text extraction successful. Extracted ${fullText.length} characters`)
    console.log('[OCR] Preview:', fullText.substring(0, 100) + '...')

    return fullText
  } catch (error) {
    console.error('[OCR] Error extracting text from image:', error)

    if (error instanceof Error) {
      throw new Error(`Text extraction failed: ${error.message}`)
    }

    throw new Error('Text extraction failed: Unknown error')
  }
}

/**
 * Extracts text from an image buffer (JPG, PNG only)
 * @param fileBuffer - The image file buffer
 * @returns The extracted text content
 */
export async function extractText(fileBuffer: Buffer): Promise<string> {
  console.log('[Extract] Starting text extraction...')
  console.log(`[Extract] File buffer size: ${(fileBuffer.length / 1024).toFixed(2)} KB`)

  try {
    // Check if file is PDF and reject it
    if (isPDF(fileBuffer)) {
      console.log('[Extract] PDF file detected - not supported')
      throw new Error('PDF files are not currently supported. Please upload JPG or PNG images of your test.')
    }

    // Process as image
    console.log('[Extract] Detected image file')
    return await extractTextFromImageBuffer(fileBuffer)
  } catch (error) {
    console.error('[Extract] Error during text extraction:', error)

    if (error instanceof Error) {
      throw error // Re-throw as-is to preserve the message
    }

    throw new Error('Text extraction failed: Unknown error')
  }
}

/**
 * Parsed test data structure
 */
export interface ParsedTestData {
  grade: string | null
  subject: string | null
  teacherComment: string | null
  rawText: string
}

/**
 * Parses German test/assignment text to extract structured information
 * @param text - The raw OCR text
 * @returns Parsed data object with grade, subject, teacher comment, and raw text
 */
export function parseGermanTest(text: string): ParsedTestData {
  console.log('Parsing German test data...')

  const result: ParsedTestData = {
    grade: null,
    subject: null,
    teacherComment: null,
    rawText: text,
  }

  // Extract grade
  // Patterns: "Note: 2-", "Note 2,5", "2+", "3-", etc.
  const gradePatterns = [
    /Note\s*:?\s*([1-6][+-]?)/i,
    /Note\s*:?\s*([1-6][,\.]\d)/i,
    /\b([1-6][+-])\b/,
    /\b([1-6][,\.]\d)\b/,
  ]

  for (const pattern of gradePatterns) {
    const match = text.match(pattern)
    if (match) {
      result.grade = match[1].replace(',', '.')
      console.log(`Grade found: ${result.grade}`)
      break
    }
  }

  // Extract subject
  // Common German school subjects
  const subjects = [
    'Mathematik',
    'Deutsch',
    'Englisch',
    'Französisch',
    'Spanisch',
    'Latein',
    'Biologie',
    'Chemie',
    'Physik',
    'Geschichte',
    'Geografie',
    'Geographie',
    'Erdkunde',
    'Politik',
    'Sozialkunde',
    'Religion',
    'Ethik',
    'Kunst',
    'Musik',
    'Sport',
    'Informatik',
  ]

  for (const subject of subjects) {
    const regex = new RegExp(`\\b${subject}\\b`, 'i')
    if (regex.test(text)) {
      result.subject = subject
      console.log(`Subject found: ${result.subject}`)
      break
    }
  }

  // Extract teacher comment
  // Look for "Bemerkung:", "Kommentar:", or similar markers
  // Using [\s\S] instead of . with s flag for ES2017 compatibility
  const commentPatterns = [
    /Bemerkung\s*:?\s*([\s\S]+?)(?:\n\n|$)/i,
    /Kommentar\s*:?\s*([\s\S]+?)(?:\n\n|$)/i,
    /Anmerkung\s*:?\s*([\s\S]+?)(?:\n\n|$)/i,
    /Feedback\s*:?\s*([\s\S]+?)(?:\n\n|$)/i,
  ]

  for (const pattern of commentPatterns) {
    const match = text.match(pattern)
    if (match) {
      result.teacherComment = match[1].trim()
      console.log(`Teacher comment found: ${result.teacherComment.substring(0, 50)}...`)
      break
    }
  }

  // If no comment marker found, try to extract the last paragraph as a potential comment
  if (!result.teacherComment) {
    const lines = text.split('\n').filter(line => line.trim().length > 20)
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim()
      // Check if it looks like a comment (longer text, not just data)
      if (lastLine.length > 30 && !lastLine.match(/^[A-Z][a-z]+:\s*\d/)) {
        result.teacherComment = lastLine
        console.log('Extracted last paragraph as potential comment')
      }
    }
  }

  console.log('Parsing complete')
  return result
}
