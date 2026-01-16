import vision from '@google-cloud/vision'
import * as pdfParse from 'pdf-parse'
import type { ParsedTestData } from './types'

// ... rest of code ...

/**
 * Extracts text from a PDF using pdf-parse
 * Note: pdf-to-png-converter doesn't work in serverless, so we only support text PDFs
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    // Parse PDF and extract text
    const pdfData = await pdfParse.default(pdfBuffer)
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