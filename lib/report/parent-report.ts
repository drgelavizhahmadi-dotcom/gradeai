export interface ParentReport {
  grade: string
  subject: string | null
  teacherComments: string[]
  warnings: string[]
  metadata: {
    pagesAnalyzed: number
    pagesWithRedText: number[]
    confidence: number
    analyzedAt: string
  }
}

export interface AIAnalysisInput {
  grade?: {
    value: string
    confidence: number
  }
  subject?: string
  teacherComments?: string[]
  pageResults?: Array<{
    page: number
    text: string
    confidence: number
    charCount: number
    hasRedText?: boolean
  }>
  overallConfidence?: number
}

const CONFIDENCE_THRESHOLD = 0.7

export function generateParentReport(analysis: AIAnalysisInput): ParentReport {
  const warnings: string[] = []

  // Determine grade with confidence check
  let grade = 'Note nicht erkannt'
  if (analysis.grade) {
    if (analysis.grade.confidence >= CONFIDENCE_THRESHOLD) {
      grade = analysis.grade.value
    } else {
      grade = 'Note nicht erkannt'
      warnings.push(
        `Notenerkennung unsicher (${(analysis.grade.confidence * 100).toFixed(0)}% Konfidenz). Bitte manuell überprüfen.`
      )
    }
  } else {
    warnings.push('Keine Note im Dokument gefunden.')
  }

  // Format teacher comments
  const teacherComments = formatTeacherComments(analysis.teacherComments || [])

  // Analyze page results for metadata
  const pageResults = analysis.pageResults || []
  const pagesAnalyzed = pageResults.length
  const pagesWithRedText = pageResults
    .filter(p => p.hasRedText)
    .map(p => p.page)

  // Add warning if no red text detected (might mean no corrections)
  if (pagesAnalyzed > 0 && pagesWithRedText.length === 0) {
    warnings.push('Keine Lehrerkorrektur (roter Text) erkannt.')
  }

  // Add warning for low overall confidence
  if (analysis.overallConfidence !== undefined && analysis.overallConfidence < CONFIDENCE_THRESHOLD) {
    warnings.push(
      `Geringe Erkennungsqualität (${(analysis.overallConfidence * 100).toFixed(0)}%). Dokument könnte schwer lesbar sein.`
    )
  }

  // Add warning for pages with no text
  const emptyPages = pageResults.filter(p => p.charCount === 0).map(p => p.page)
  if (emptyPages.length > 0) {
    warnings.push(`Seite(n) ${emptyPages.join(', ')} enthält keinen erkennbaren Text.`)
  }

  return {
    grade,
    subject: analysis.subject || null,
    teacherComments,
    warnings,
    metadata: {
      pagesAnalyzed,
      pagesWithRedText,
      confidence: analysis.overallConfidence ?? (analysis.grade?.confidence || 0),
      analyzedAt: new Date().toISOString()
    }
  }
}

function formatTeacherComments(comments: string[]): string[] {
  return comments
    .map(comment => comment.trim())
    .filter(comment => comment.length > 0)
    .map(comment => {
      // Capitalize first letter
      if (comment.length > 0) {
        return comment.charAt(0).toUpperCase() + comment.slice(1)
      }
      return comment
    })
}
