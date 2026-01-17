import * as vision from '@google-cloud/vision'
import type { ParsedTestData } from './types'

let client: vision.ImageAnnotatorClient | null = null

function initializeVisionClient() {
  if (client) return client

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON

  if (!credentialsPath && !credentialsJson) {
    throw new Error('Google Cloud credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CREDENTIALS_JSON')
  }

  try {
    let credentials
    if (credentialsJson) {
      // Vercel: Use JSON string from environment variable
      credentials = JSON.parse(credentialsJson)
    } else if (credentialsPath) {
      // Local: Use file path
      const fs = require('fs')
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf8')
      credentials = JSON.parse(credentialsContent)
    }

    // Ensure private_key has proper newlines (fix \n literals)
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')
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

export async function extractText(fileBuffer: Buffer): Promise<string> {
  const isPdf = fileBuffer.toString('utf8', 0, 4) === '%PDF'

  if (isPdf) {
    return extractTextFromPdf(fileBuffer)
  } else {
    return extractTextFromImage(fileBuffer)
  }
}

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

async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    console.warn('[OCR] PDF support requires text-based PDFs. Image-based PDFs are not supported in production.')
    return ''
  } catch (error) {
    console.error('[OCR] PDF parsing failed:', error)
    return ''
  }
}

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