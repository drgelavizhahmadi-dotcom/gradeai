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
 * OCR extraction result
 */
export interface OCRResult {
  text: string
  parsed: ParsedTestData
}
