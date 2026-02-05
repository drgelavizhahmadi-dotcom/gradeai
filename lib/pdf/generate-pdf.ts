/**
 * PDF Generation Utilities for GradeAI
 * Generates beautiful, printable PDFs for all premium features
 */

import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: { finalY: number }
  }
}

// Color palette
const COLORS = {
  primary: [139, 92, 246] as [number, number, number],      // Purple
  secondary: [59, 130, 246] as [number, number, number],    // Blue
  success: [34, 197, 94] as [number, number, number],       // Green
  warning: [245, 158, 11] as [number, number, number],      // Amber
  danger: [239, 68, 68] as [number, number, number],        // Red
  gray: [107, 114, 128] as [number, number, number],        // Gray
  dark: [31, 41, 55] as [number, number, number],           // Dark gray
  light: [249, 250, 251] as [number, number, number],       // Light gray
}

interface PDFOptions {
  childName?: string | undefined
  date?: string | undefined
  subject?: string | undefined
}

// Helper to add header to each page
function addHeader(doc: jsPDF, title: string, options: PDFOptions) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header background
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 35, 'F')

  // Logo text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('GradeAI', 15, 18)

  // Subtitle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Intelligente Lernhilfe', 15, 26)

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth - 15, 18, { align: 'right' })

  // Child name and date
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const info = [
    options.childName ? `Für: ${options.childName}` : '',
    options.subject ? `Fach: ${options.subject}` : '',
    options.date || new Date().toLocaleDateString('de-DE'),
  ].filter(Boolean).join(' | ')
  doc.text(info, pageWidth - 15, 26, { align: 'right' })

  // Reset text color
  doc.setTextColor(...COLORS.dark)

  return 45 // Return Y position after header
}

// Helper to add footer
function addFooter(doc: jsPDF, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gray)
  doc.text(
    `Erstellt mit GradeAI | www.gradeai.de | Seite ${pageNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )
  doc.setTextColor(...COLORS.dark)
}

// Helper to add a section title
function addSectionTitle(doc: jsPDF, title: string, y: number, color: [number, number, number] = COLORS.primary): number {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Section background
  doc.setFillColor(...color)
  doc.roundedRect(15, y, pageWidth - 30, 10, 2, 2, 'F')

  // Section title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 20, y + 7)

  doc.setTextColor(...COLORS.dark)
  return y + 15
}

// Check if we need a new page
function checkNewPage(doc: jsPDF, y: number, requiredSpace: number = 40): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (y + requiredSpace > pageHeight - 20) {
    doc.addPage()
    addFooter(doc, doc.internal.pages.length - 1)
    return 20
  }
  return y
}

// ============================================
// FLASHCARDS PDF
// ============================================

export function generateFlashcardsPDF(flashcardData: any, options: PDFOptions = {}): void {
  const doc = new jsPDF()
  let y = addHeader(doc, 'Lernkarten', options)

  const flashcards = flashcardData.flashcards || []
  const studyPlan = flashcardData.studyPlan || {}

  // Study Plan Section
  if (studyPlan.dailyGoal) {
    y = addSectionTitle(doc, 'Lernplan', y, COLORS.secondary)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const planItems = [
      ['Tägliches Ziel:', studyPlan.dailyGoal],
      ['Gesamtzeit:', studyPlan.totalTime],
      ['Wiederholung:', studyPlan.reviewSchedule],
    ]

    planItems.forEach(([label, value]) => {
      if (value) {
        doc.setFont('helvetica', 'bold')
        doc.text(label, 20, y)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), 60, y)
        y += 6
      }
    })

    y += 10
  }

  // Flashcards
  y = addSectionTitle(doc, `Lernkarten (${flashcards.length})`, y, COLORS.primary)

  flashcards.forEach((card: any, index: number) => {
    y = checkNewPage(doc, y, 50)

    const pageWidth = doc.internal.pageSize.getWidth()
    const cardWidth = pageWidth - 30

    // Card container
    doc.setDrawColor(...COLORS.gray)
    doc.setFillColor(...COLORS.light)
    doc.roundedRect(15, y, cardWidth, 45, 3, 3, 'FD')

    // Card number and difficulty
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(`Karte ${index + 1}`, 20, y + 7)

    // Difficulty badge
    const diffColor = card.difficulty === 'easy' ? COLORS.success :
                      card.difficulty === 'hard' ? COLORS.danger : COLORS.warning
    doc.setTextColor(...diffColor)
    const diffText = card.difficulty === 'easy' ? 'Leicht' :
                     card.difficulty === 'hard' ? 'Schwer' : 'Mittel'
    doc.text(diffText, pageWidth - 35, y + 7)

    // Front (Question)
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Frage:', 20, y + 15)
    doc.setFont('helvetica', 'normal')
    const frontLines = doc.splitTextToSize(card.front || '', cardWidth - 35)
    doc.text(frontLines, 45, y + 15)

    // Back (Answer)
    doc.setFont('helvetica', 'bold')
    doc.text('Antwort:', 20, y + 27)
    doc.setFont('helvetica', 'normal')
    const backLines = doc.splitTextToSize(card.back || '', cardWidth - 35)
    doc.text(backLines, 45, y + 27)

    // Tip
    if (card.tip) {
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.warning)
      doc.text(`Tipp: ${card.tip}`, 20, y + 40)
    }

    doc.setTextColor(...COLORS.dark)
    y += 52
  })

  // Print instructions
  if (flashcardData.printInstructions) {
    y = checkNewPage(doc, y, 30)
    y = addSectionTitle(doc, 'Druckanleitung', y, COLORS.gray)
    doc.setFontSize(9)
    doc.text(flashcardData.printInstructions, 20, y)
    y += 15
  }

  addFooter(doc, 1)
  doc.save(`GradeAI_Lernkarten_${options.childName || 'Export'}.pdf`)
}

// ============================================
// FAIRNESS CHECK PDF
// ============================================

export function generateFairnessPDF(fairnessData: any, options: PDFOptions = {}): void {
  const doc = new jsPDF()
  let y = addHeader(doc, 'Fairness-Check', options)

  // Score Section
  y = addSectionTitle(doc, 'Fairness-Bewertung', y, COLORS.secondary)

  const pageWidth = doc.internal.pageSize.getWidth()

  // Big score display
  const score = fairnessData.fairnessScore || 0
  const scoreColor = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger

  doc.setFontSize(48)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...scoreColor)
  doc.text(`${score}%`, pageWidth / 2, y + 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(...COLORS.dark)
  doc.text('Fairness-Score', pageWidth / 2, y + 30, { align: 'center' })

  // Verdict
  const verdictText = fairnessData.verdict === 'fair' ? 'Bewertung ist fair' :
                      fairnessData.verdict === 'mostly_fair' ? 'Überwiegend fair' :
                      fairnessData.verdict === 'questionable' ? 'Einige Fragen offen' :
                      'Überprüfung empfohlen'

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(verdictText, pageWidth / 2, y + 42, { align: 'center' })

  if (fairnessData.verdictExplanation) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const explLines = doc.splitTextToSize(fairnessData.verdictExplanation, pageWidth - 60)
    doc.text(explLines, pageWidth / 2, y + 50, { align: 'center' })
  }

  y += 65

  // Analysis breakdown
  if (fairnessData.analysis) {
    y = checkNewPage(doc, y, 50)
    y = addSectionTitle(doc, 'Detailanalyse', y, COLORS.primary)

    const analysisData = Object.entries(fairnessData.analysis).map(([key, value]: [string, any]) => {
      const label = key === 'consistency' ? 'Konsistenz' :
                    key === 'clarity' ? 'Klarheit' :
                    key === 'proportionality' ? 'Verhältnismäßigkeit' :
                    key === 'feedbackQuality' ? 'Feedback-Qualität' :
                    key === 'partialCredit' ? 'Teilpunkte' : key
      return [label, `${value.score}%`]
    })

    doc.autoTable({
      startY: y,
      head: [['Kriterium', 'Score']],
      body: analysisData,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      margin: { left: 20, right: 20 },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  // Concerns
  if (fairnessData.concerns && fairnessData.concerns.length > 0) {
    y = checkNewPage(doc, y, 40)
    y = addSectionTitle(doc, 'Mögliche Bedenken', y, COLORS.warning)

    fairnessData.concerns.forEach((concern: any, index: number) => {
      y = checkNewPage(doc, y, 15)

      const severity = concern.severity === 'significant' ? 'Wichtig' :
                       concern.severity === 'moderate' ? 'Moderat' : 'Gering'
      const sevColor = concern.severity === 'significant' ? COLORS.danger :
                       concern.severity === 'moderate' ? COLORS.warning : COLORS.gray

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...sevColor)
      doc.text(`[${severity}]`, 20, y)

      doc.setTextColor(...COLORS.dark)
      doc.setFont('helvetica', 'normal')
      const issueLines = doc.splitTextToSize(concern.issue || '', pageWidth - 60)
      doc.text(issueLines, 45, y)

      y += 8 + (issueLines.length - 1) * 4
    })

    y += 5
  }

  // Recommendation
  if (fairnessData.recommendation) {
    y = checkNewPage(doc, y, 50)
    y = addSectionTitle(doc, 'Empfehlung', y, COLORS.success)

    doc.setFontSize(10)

    if (fairnessData.recommendation.shouldDiscussWithTeacher) {
      doc.setTextColor(...COLORS.secondary)
      doc.text('Gespräch mit Lehrer empfohlen', 20, y)
    } else {
      doc.setTextColor(...COLORS.success)
      doc.text('Kein Gespräch nötig', 20, y)
    }
    y += 8

    if (fairnessData.recommendation.suggestedApproach) {
      doc.setTextColor(...COLORS.dark)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const approachLines = doc.splitTextToSize(fairnessData.recommendation.suggestedApproach, pageWidth - 40)
      doc.text(approachLines, 20, y)
      y += approachLines.length * 5 + 5
    }

    if (fairnessData.recommendation.questionsToAsk) {
      doc.setFont('helvetica', 'bold')
      doc.text('Fragen für das Gespräch:', 20, y)
      y += 6

      doc.setFont('helvetica', 'normal')
      fairnessData.recommendation.questionsToAsk.forEach((q: string) => {
        y = checkNewPage(doc, y, 10)
        doc.text(`• ${q}`, 25, y)
        y += 5
      })
    }
  }

  // Disclaimer
  y = checkNewPage(doc, y, 20)
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gray)
  doc.text(
    fairnessData.disclaimer || 'Diese Analyse dient nur zur Orientierung. Im Zweifel sprechen Sie direkt mit dem Lehrer.',
    pageWidth / 2,
    y + 10,
    { align: 'center' }
  )

  addFooter(doc, 1)
  doc.save(`GradeAI_Fairness-Check_${options.childName || 'Export'}.pdf`)
}

// ============================================
// LEARNING MATERIAL PDF
// ============================================

export function generateLearningMaterialPDF(materialData: any, options: PDFOptions = {}): void {
  const doc = new jsPDF()
  let pageNum = 1
  let y = addHeader(doc, 'Personalisiertes Lernmaterial', options)

  const pageWidth = doc.internal.pageSize.getWidth()

  // Learning Plan Overview
  if (materialData.learningPlan?.analysis) {
    y = addSectionTitle(doc, 'Lernplan-Übersicht', y, COLORS.primary)

    const analysis = materialData.learningPlan.analysis

    doc.setFontSize(10)
    const planData = [
      ['Geschätzte Zeit:', analysis.estimatedLearningTime || '-'],
      ['Schwierigkeitsgrad:', analysis.difficultyLevel || '-'],
      ['Schwerpunkte:', String(analysis.primaryWeaknesses?.length || 0)],
    ]

    planData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, y)
      doc.setFont('helvetica', 'normal')
      doc.text(value, 70, y)
      y += 6
    })

    // Learning path
    if (materialData.learningPlan.learningPath) {
      y += 5
      const path = materialData.learningPlan.learningPath

      if (path.immediate) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.danger)
        doc.text('Sofort:', 20, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const immLines = doc.splitTextToSize(path.immediate, pageWidth - 60)
        doc.text(immLines, 50, y)
        y += immLines.length * 5 + 3
      }

      if (path.shortTerm) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.warning)
        doc.text('Diese Woche:', 20, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const shortLines = doc.splitTextToSize(path.shortTerm, pageWidth - 70)
        doc.text(shortLines, 60, y)
        y += shortLines.length * 5 + 3
      }

      if (path.longTerm) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.success)
        doc.text('Diesen Monat:', 20, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const longLines = doc.splitTextToSize(path.longTerm, pageWidth - 70)
        doc.text(longLines, 65, y)
        y += longLines.length * 5 + 3
      }
    }

    y += 10
  }

  // LESSONS
  if (materialData.lessons?.lessons && materialData.lessons.lessons.length > 0) {
    y = checkNewPage(doc, y, 30)
    y = addSectionTitle(doc, `Lektionen (${materialData.lessons.lessons.length})`, y, COLORS.primary)

    materialData.lessons.lessons.forEach((lesson: any, index: number) => {
      y = checkNewPage(doc, y, 60)

      // Lesson title
      doc.setFillColor(...COLORS.light)
      doc.roundedRect(15, y, pageWidth - 30, 8, 2, 2, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primary)
      doc.text(`${index + 1}. ${lesson.title || 'Lektion'}`, 20, y + 6)
      y += 12

      // Target weakness
      if (lesson.targetWeakness) {
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.gray)
        doc.text(`Für: ${lesson.targetWeakness}`, 20, y)
        y += 6
      }

      // Explanation
      if (lesson.explanation) {
        doc.setTextColor(...COLORS.dark)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const explLines = doc.splitTextToSize(lesson.explanation, pageWidth - 40)

        explLines.forEach((line: string) => {
          y = checkNewPage(doc, y, 8)
          doc.text(line, 20, y)
          y += 5
        })
        y += 3
      }

      // Key points
      if (lesson.keyPoints && lesson.keyPoints.length > 0) {
        y = checkNewPage(doc, y, 20)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...COLORS.primary)
        doc.text('Wichtige Punkte:', 20, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        lesson.keyPoints.forEach((point: string) => {
          y = checkNewPage(doc, y, 8)
          doc.text(`• ${point}`, 25, y)
          y += 5
        })
        y += 3
      }

      // Memory trick
      if (lesson.memoryTrick) {
        y = checkNewPage(doc, y, 15)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.warning)
        doc.text('Merkhilfe:', 20, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...COLORS.dark)
        const trickLines = doc.splitTextToSize(lesson.memoryTrick, pageWidth - 60)
        doc.text(trickLines, 50, y)
        y += trickLines.length * 5 + 5
      }

      y += 8
    })
  }

  // WORKSHEETS
  if (materialData.worksheets?.worksheets && materialData.worksheets.worksheets.length > 0) {
    doc.addPage()
    pageNum++
    y = 20
    y = addSectionTitle(doc, `Arbeitsblätter (${materialData.worksheets.worksheets.length})`, y, COLORS.secondary)

    materialData.worksheets.worksheets.forEach((worksheet: any, wsIndex: number) => {
      y = checkNewPage(doc, y, 40)

      // Worksheet header
      doc.setFillColor(...COLORS.secondary)
      doc.roundedRect(15, y, pageWidth - 30, 12, 2, 2, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(worksheet.title || `Arbeitsblatt ${wsIndex + 1}`, 20, y + 8)

      // Difficulty and time
      const diffText = worksheet.difficulty === 'beginner' ? 'Anfänger' :
                       worksheet.difficulty === 'advanced' ? 'Fortgeschritten' : 'Mittel'
      doc.setFontSize(9)
      doc.text(`${diffText} | ${worksheet.estimatedTime || '15-20 Min'}`, pageWidth - 20, y + 8, { align: 'right' })
      y += 16

      // Instructions
      if (worksheet.instructions) {
        doc.setTextColor(...COLORS.dark)
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        const instrLines = doc.splitTextToSize(worksheet.instructions, pageWidth - 40)
        doc.text(instrLines, 20, y)
        y += instrLines.length * 4 + 5
      }

      // Problems
      if (worksheet.problems) {
        worksheet.problems.forEach((problem: any) => {
          y = checkNewPage(doc, y, 25)

          // Problem box
          doc.setDrawColor(...COLORS.gray)
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(20, y, pageWidth - 40, 20, 2, 2, 'FD')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(...COLORS.dark)
          doc.text(`Aufgabe ${problem.number}`, 25, y + 6)

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.text(`(${problem.points || 1} Punkte)`, pageWidth - 45, y + 6)

          const qLines = doc.splitTextToSize(problem.question || '', pageWidth - 55)
          doc.text(qLines, 25, y + 13)

          y += 25

          // Options if multiple choice
          if (problem.options) {
            problem.options.forEach((opt: string, optIndex: number) => {
              y = checkNewPage(doc, y, 8)
              doc.text(`   ${String.fromCharCode(65 + optIndex)}) ${opt}`, 25, y)
              y += 5
            })
            y += 3
          }

          // Space for answer
          doc.setDrawColor(...COLORS.gray)
          doc.line(25, y + 5, pageWidth - 25, y + 5)
          y += 12
        })
      }

      y += 10
    })

    // Answer key on new page
    doc.addPage()
    pageNum++
    y = 20
    y = addSectionTitle(doc, 'Lösungen', y, COLORS.success)

    materialData.worksheets.worksheets.forEach((worksheet: any, wsIndex: number) => {
      if (worksheet.answerKey) {
        y = checkNewPage(doc, y, 20)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.text(worksheet.title || `Arbeitsblatt ${wsIndex + 1}`, 20, y)
        y += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)

        worksheet.answerKey.forEach((ans: any) => {
          y = checkNewPage(doc, y, 8)
          doc.setTextColor(...COLORS.success)
          doc.text(`${ans.number}.`, 25, y)
          doc.setTextColor(...COLORS.dark)
          doc.text(ans.answer || '', 35, y)
          y += 5
        })

        y += 8
      }
    })
  }

  // QUIZZES
  if (materialData.quizzes?.quizzes && materialData.quizzes.quizzes.length > 0) {
    doc.addPage()
    pageNum++
    y = 20
    y = addSectionTitle(doc, `Quizze (${materialData.quizzes.quizzes.length})`, y, COLORS.success)

    materialData.quizzes.quizzes.forEach((quiz: any, quizIndex: number) => {
      y = checkNewPage(doc, y, 30)

      // Quiz header
      doc.setFillColor(...COLORS.success)
      doc.roundedRect(15, y, pageWidth - 30, 12, 2, 2, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(quiz.title || `Quiz ${quizIndex + 1}`, 20, y + 8)
      doc.setFontSize(9)
      doc.text(`${quiz.timeLimit || '10 Min'} | Bestehen: ${quiz.passingScore || 70}%`, pageWidth - 20, y + 8, { align: 'right' })
      y += 18

      // Questions
      if (quiz.questions) {
        quiz.questions.forEach((q: any) => {
          y = checkNewPage(doc, y, 30)

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(...COLORS.dark)
          doc.text(`Frage ${q.number}:`, 20, y)

          doc.setFont('helvetica', 'normal')
          const qLines = doc.splitTextToSize(q.question || '', pageWidth - 45)
          doc.text(qLines, 50, y)
          y += qLines.length * 5 + 3

          // Options
          if (q.options) {
            q.options.forEach((opt: string, optIndex: number) => {
              y = checkNewPage(doc, y, 6)
              const letter = String.fromCharCode(65 + optIndex)
              doc.text(`   ${letter}) ${opt}`, 25, y)
              y += 5
            })
          }

          y += 8
        })
      }

      y += 10
    })
  }

  // Add footers to all pages
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  doc.save(`GradeAI_Lernmaterial_${options.childName || 'Export'}.pdf`)
}

// ============================================
// COMBINED REPORT PDF
// ============================================

export function generateCombinedReportPDF(
  reportData: any,
  flashcardData?: any,
  fairnessData?: any,
  learningData?: any,
  options: PDFOptions = {}
): void {
  const doc = new jsPDF()
  let y = addHeader(doc, 'Vollständiger Bericht', options)

  // Add summary section
  y = addSectionTitle(doc, 'Zusammenfassung', y, COLORS.primary)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const summaryItems = [
    options.childName ? `Schüler: ${options.childName}` : null,
    options.subject ? `Fach: ${options.subject}` : null,
    reportData?.grade?.value ? `Note: ${reportData.grade.value}` : null,
    `Erstellt am: ${new Date().toLocaleDateString('de-DE')}`,
  ].filter(Boolean)

  summaryItems.forEach((item) => {
    if (item) {
      doc.text(item, 20, y)
      y += 6
    }
  })

  y += 10

  // Features generated
  y = addSectionTitle(doc, 'Enthaltene Materialien', y, COLORS.secondary)

  const features = [
    flashcardData ? `✓ Lernkarten (${flashcardData.flashcards?.length || 0})` : null,
    fairnessData ? `✓ Fairness-Check (Score: ${fairnessData.fairnessScore}%)` : null,
    learningData ? `✓ Lernmaterial (${(learningData.lessons?.lessons?.length || 0) + (learningData.worksheets?.worksheets?.length || 0) + (learningData.quizzes?.quizzes?.length || 0)} Einheiten)` : null,
  ].filter(Boolean)

  features.forEach((feature) => {
    if (feature) {
      doc.text(feature, 20, y)
      y += 6
    }
  })

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.gray)
  doc.text('Für detaillierte Materialien verwenden Sie bitte die einzelnen PDF-Exporte.', 20, y + 10)

  addFooter(doc, 1)
  doc.save(`GradeAI_Bericht_${options.childName || 'Export'}.pdf`)
}
