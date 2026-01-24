/**
 * Request body for the analyze API endpoint
 */
export interface AnalyzeRequestBody {
  uploadId: string
}

/**
 * Successful response from the analyze API
 */
export interface AnalyzeSuccessResponse {
  success: true
  uploadId: string
  data: {
    extractedText: string
    parsed: {
      grade: string | null
      gradeNumeric: number | null
      subject: string | null
      teacherComment: string | null
    }
    analysis: {
      parsedAt: string
      confidence: string
      extractedData: {
        grade: string | null
        gradeNumeric: number | null
        subject: string | null
        teacherComment: string | null
      }
    }
  }
}

/**
 * Error response from the analyze API
 */
export interface AnalyzeErrorResponse {
  success: false
  error: string
}

/**
 * Combined response type
 */
export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse
