/**
 * PDF Generation Utilities for GradeAI
 * Generates beautiful, printable PDFs for all premium features
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    addFooter(doc, doc.getNumberOfPages())
    return 20
  }
  return y
}

// ============================================
// FLASHCARDS PDF
// ============================================

export function generateFlashcardsPDF(flashcardData: any, options: PDFOptions = {}): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const cardWidth = pageWidth - 30
  let y = addHeader(doc, 'Lernkarten', options)
  let pageNum = 1

  const flashcards = flashcardData.flashcards || []
  const studyPlan = flashcardData.studyPlan || {}

  // Study Plan Section
  if (studyPlan.dailyGoal) {
    y = addSectionTitle(doc, 'Lernplan', y, COLORS.secondary)

    doc.setFontSize(10)
    const planItems: [string, string][] = [
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
    y += 8
  }

  // Flashcards — each card shows BOTH sides clearly
  y = addSectionTitle(doc, `Lernkarten (${flashcards.length}) – Vorder- und Rückseite`, y, COLORS.primary)
  y += 2

  flashcards.forEach((card: any, index: number) => {
    // ── measure content heights before drawing ──────────────────
    doc.setFontSize(10)
    const frontLines = doc.splitTextToSize(card.front || '', cardWidth - 20)
    const backLines  = doc.splitTextToSize(card.back  || '', cardWidth - 20)
    const tipLines   = card.tip ? doc.splitTextToSize(`Tipp: ${card.tip}`, cardWidth - 20) : []

    const lineH  = 5.5   // line height in mm
    const pad    = 4     // inner padding
    const headerH = 8    // card-number + difficulty row
    const labelH  = 5    // "Frage:" / "Antwort:" label row
    const dividerH = 6   // divider row between front and back

    const frontBlockH = labelH + frontLines.length * lineH + pad
    const backBlockH  = labelH + backLines.length  * lineH + pad
    const tipBlockH   = tipLines.length > 0 ? tipLines.length * lineH + pad : 0
    const totalCardH  = headerH + frontBlockH + dividerH + backBlockH + tipBlockH + pad * 2

    y = checkNewPage(doc, y, totalCardH + 6)

    // ── card outer box ───────────────────────────────────────────
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(15, y, cardWidth, totalCardH, 3, 3, 'FD')

    // ── header strip ────────────────────────────────────────────
    const diffColor = card.difficulty === 'easy' ? COLORS.success :
                      card.difficulty === 'hard'  ? COLORS.danger  : COLORS.warning
    const diffText  = card.difficulty === 'easy' ? 'Leicht' :
                      card.difficulty === 'hard'  ? 'Schwer' : 'Mittel'

    doc.setFillColor(...COLORS.primary)
    doc.roundedRect(15, y, cardWidth, headerH + 1, 3, 3, 'F')
    // cover bottom rounded corners of header
    doc.setFillColor(...COLORS.primary)
    doc.rect(15, y + headerH - 2, cardWidth, 3, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text(`Karte ${index + 1}`, 20, y + 6)

    doc.setTextColor(...diffColor)
    doc.setFillColor(...diffColor)
    doc.roundedRect(pageWidth - 40, y + 2, 22, 5, 1, 1, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(diffText, pageWidth - 29, y + 6, { align: 'center' })

    if (card.forWeakness) {
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      const weakLines = doc.splitTextToSize(`Für: ${card.forWeakness}`, cardWidth - 50)
      doc.text(weakLines[0], 50, y + 6)
    }

    doc.setTextColor(...COLORS.dark)
    let cy = y + headerH + pad

    // ── FRONT section ────────────────────────────────────────────
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.secondary)
    doc.text('FRAGE / VORDERSEITE', 20, cy)
    cy += labelH

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.dark)
    doc.text(frontLines, 20, cy)
    cy += frontLines.length * lineH + pad

    // ── divider with "ANTWORT" label ─────────────────────────────
    // amber background strip
    doc.setFillColor(254, 243, 199) // amber-100
    doc.rect(15, cy, cardWidth, dividerH, 'F')
    doc.setDrawColor(251, 191, 36)  // amber-400
    doc.line(15, cy, 15 + cardWidth, cy)
    doc.line(15, cy + dividerH, 15 + cardWidth, cy + dividerH)

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(146, 64, 14)   // amber-800
    doc.text('ANTWORT / RÜCKSEITE', 20, cy + 4.5)
    cy += dividerH + pad

    // ── BACK section ─────────────────────────────────────────────
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.dark)
    doc.text(backLines, 20, cy)
    cy += backLines.length * lineH + pad

    // ── Tip ──────────────────────────────────────────────────────
    if (tipLines.length > 0) {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...COLORS.warning)
      doc.text(tipLines, 20, cy)
    }

    doc.setTextColor(...COLORS.dark)
    y += totalCardH + 6
  })

  // Print instructions
  if (flashcardData.printInstructions) {
    y = checkNewPage(doc, y, 30)
    y = addSectionTitle(doc, 'Druckanleitung', y, COLORS.gray)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const instrLines = doc.splitTextToSize(flashcardData.printInstructions, pageWidth - 40)
    doc.text(instrLines, 20, y)
  }

  // Footers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  doc.save(`GradeAI_Lernkarten_${options.childName || 'Export'}.pdf`)
}

// ============================================
// FAIRNESS CHECK PDF
// ============================================

export function generateFairnessPDF(fairnessData: any, options: PDFOptions = {}): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = addHeader(doc, 'Fairness-Check', options)

  // Extract nested data from independent-fairness API response structure
  const fa = fairnessData.fairnessAnalysis || fairnessData  // fairnessAnalysis sub-object
  const tr = fairnessData.testReconstruction || {}           // testReconstruction sub-object

  const score = fa.overallScore ?? fa.fairnessScore ?? 0
  const verdict = fa.verdict || ''
  const verdictSummary = fa.verdictSummary || fa.verdictExplanation || ''
  const dimensions = fa.dimensions || fa.analysis || {}
  const concerns = fa.concerns || []
  const positiveFindings = fa.positiveFindings || []
  const gradeBoundary = fa.gradeBoundaryAnalysis || {}
  const recoveryOpps = fa.pointRecoveryOpportunities || []
  const recommendation = fa.recommendation || {}

  // ── Score Banner ───────────────────────────────────────────────
  const scoreColor = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger

  doc.setFontSize(48)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...scoreColor)
  doc.text(`${score}`, pageWidth / 2, y + 18, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.gray)
  doc.text('Fairness-Score (0–100)', pageWidth / 2, y + 25, { align: 'center' })

  const verdictLabel =
    verdict === 'fair'           ? 'Bewertung ist fair' :
    verdict === 'mostly_fair'    ? 'Überwiegend fair' :
    verdict === 'some_concerns'  ? 'Einige Bedenken' :
    verdict === 'questionable'   ? 'Fraglich' :
    verdict === 'needs_review'   ? 'Überprüfung empfohlen' :
    'Analyse abgeschlossen'

  const verdictColor = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...verdictColor)
  doc.text(verdictLabel, pageWidth / 2, y + 34, { align: 'center' })

  if (verdictSummary) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    const summLines = doc.splitTextToSize(verdictSummary, pageWidth - 50)
    doc.text(summLines, pageWidth / 2, y + 42, { align: 'center' })
    y += summLines.length * 4
  }

  y += 58

  // ── Test Reconstruction ────────────────────────────────────────
  if (tr.subject || tr.topic || tr.maxPoints) {
    y = checkNewPage(doc, y, 40)
    y = addSectionTitle(doc, 'Test-Zusammenfassung', y, COLORS.secondary)

    const infoRows: [string, string][] = [
      ['Fach:', tr.subject || '-'],
      ['Thema:', tr.topic || '-'],
      ['Art:', tr.testType || '-'],
      ['Erzielte Punkte:', `${tr.achievedPoints ?? '-'} / ${tr.maxPoints ?? '-'} (${tr.calculatedPercentage ?? '-'}%)`],
      ['Note:', tr.gradeGiven || '-'],
    ]

    doc.setFontSize(9)
    infoRows.forEach(([label, value]) => {
      if (value && value !== '-') {
        y = checkNewPage(doc, y, 7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text(label, 20, y)
        doc.setFont('helvetica', 'normal')
        doc.text(value, 65, y)
        y += 5.5
      }
    })

    // Teacher comment
    if (tr.teacherComments?.finalComment) {
      y = checkNewPage(doc, y, 12)
      doc.setFont('helvetica', 'bold')
      doc.text('Lehrer-Kommentar:', 20, y)
      y += 5
      doc.setFont('helvetica', 'italic')
      const cmtLines = doc.splitTextToSize(`"${tr.teacherComments.finalComment}"`, pageWidth - 45)
      doc.text(cmtLines, 25, y)
      y += cmtLines.length * 4.5
    }

    y += 6
  }

  // ── Dimension breakdown table ──────────────────────────────────
  if (Object.keys(dimensions).length > 0) {
    y = checkNewPage(doc, y, 50)
    y = addSectionTitle(doc, 'Detailanalyse', y, COLORS.primary)

    const dimLabels: Record<string, string> = {
      gradingConsistency:    'Benotungskonsistenz',
      pointProportionality:  'Punktverhältnismäßigkeit',
      partialCredit:         'Teilpunkte',
      feedbackQuality:       'Feedback-Qualität',
      mathematicalAccuracy:  'Rechnerische Richtigkeit',
      consistency:           'Konsistenz',
      proportionality:       'Verhältnismäßigkeit',
      clarity:               'Klarheit',
    }

    const tableBody = Object.entries(dimensions).map(([key, val]: [string, any]) => {
      const label = dimLabels[key] || key
      const scoreVal = val?.score ?? '-'
      const finding = val?.finding || val?.detail || ''
      const concern = val?.concern || ''
      return [label, `${scoreVal}`, finding + (concern ? `\n⚠ ${concern}` : '')]
    })

    autoTable(doc, {
      startY: y,
      head: [['Kriterium', 'Score', 'Befund']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: COLORS.primary },
      columnStyles: { 0: { cellWidth: 52 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 110 } },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      margin: { left: 15, right: 15 },
    })

    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── Positive Findings ──────────────────────────────────────────
  if (positiveFindings.length > 0) {
    y = checkNewPage(doc, y, 30)
    y = addSectionTitle(doc, 'Positive Aspekte', y, COLORS.success)

    positiveFindings.forEach((pf: any) => {
      y = checkNewPage(doc, y, 12)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.success)
      doc.text('✓', 20, y)
      doc.setTextColor(...COLORS.dark)
      doc.setFont('helvetica', 'normal')
      const pfLines = doc.splitTextToSize(`${pf.title || ''}: ${pf.detail || ''}`, pageWidth - 45)
      doc.text(pfLines, 28, y)
      y += pfLines.length * 4.5 + 2
    })

    y += 4
  }

  // ── Concerns ──────────────────────────────────────────────────
  if (concerns.length > 0) {
    y = checkNewPage(doc, y, 40)
    y = addSectionTitle(doc, 'Bedenken & Auffälligkeiten', y, COLORS.warning)

    concerns.forEach((concern: any) => {
      y = checkNewPage(doc, y, 20)

      const severity = concern.severity === 'significant' ? 'Wichtig' :
                       concern.severity === 'moderate'    ? 'Moderat' : 'Gering'
      const sevColor = concern.severity === 'significant' ? COLORS.danger :
                       concern.severity === 'moderate'    ? COLORS.warning : COLORS.gray

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...sevColor)
      doc.text(`[${severity}]`, 20, y)

      doc.setTextColor(...COLORS.dark)
      const titleTxt = concern.title || concern.issue || ''
      const titleLines = doc.splitTextToSize(titleTxt, pageWidth - 55)
      doc.text(titleLines, 48, y)
      y += Math.max(titleLines.length * 4.5, 5)

      if (concern.detail) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        const detailLines = doc.splitTextToSize(concern.detail, pageWidth - 45)
        doc.text(detailLines, 25, y)
        y += detailLines.length * 4 + 2
      }

      if (concern.recommendation) {
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...COLORS.secondary)
        const recLines = doc.splitTextToSize(`→ ${concern.recommendation}`, pageWidth - 45)
        doc.text(recLines, 25, y)
        doc.setTextColor(...COLORS.dark)
        y += recLines.length * 4 + 2
      }

      y += 3
    })

    y += 3
  }

  // ── Grade Boundary Analysis ────────────────────────────────────
  if (gradeBoundary.currentGrade || gradeBoundary.analysis) {
    y = checkNewPage(doc, y, 40)
    y = addSectionTitle(doc, 'Notengrenz-Analyse', y, COLORS.secondary)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)

    const gbRows: [string, string][] = [
      ['Aktuelle Note:', gradeBoundary.currentGrade || '-'],
      ['Aktuelle Punkte:', `${gradeBoundary.currentPoints ?? '-'} / ${gradeBoundary.maxPoints ?? '-'} (${gradeBoundary.percentage ?? '-'}%)`],
      ['Nächstbessere Note:', gradeBoundary.nextBetterGrade || '-'],
      ['Fehlende Punkte:', gradeBoundary.pointsNeededForBetter != null ? `${gradeBoundary.pointsNeededForBetter} Punkte` : '-'],
      ['Rückholbare Punkte:', gradeBoundary.potentialRecoverablePoints != null ? `${gradeBoundary.potentialRecoverablePoints} Punkte` : '-'],
      ['Notenänderung möglich:', gradeBoundary.couldChangeGrade ? 'Ja – Überprüfung lohnt sich!' : 'Nein'],
    ]

    gbRows.forEach(([label, value]) => {
      if (value && value !== '-') {
        y = checkNewPage(doc, y, 7)
        doc.setFont('helvetica', 'bold')
        doc.text(label, 20, y)
        doc.setFont('helvetica', 'normal')
        const isHighlight = label.includes('Notenänderung') && gradeBoundary.couldChangeGrade
        if (isHighlight) doc.setTextColor(...COLORS.success)
        doc.text(value, 80, y)
        if (isHighlight) doc.setTextColor(...COLORS.dark)
        y += 5.5
      }
    })

    if (gradeBoundary.analysis) {
      y = checkNewPage(doc, y, 15)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      const gbAnalLines = doc.splitTextToSize(gradeBoundary.analysis, pageWidth - 40)
      doc.text(gbAnalLines, 20, y)
      y += gbAnalLines.length * 4 + 5
    }

    y += 5
  }

  // ── Point Recovery Opportunities ──────────────────────────────
  if (recoveryOpps.length > 0) {
    y = checkNewPage(doc, y, 40)
    y = addSectionTitle(doc, 'Punktrückholungs-Möglichkeiten', y, COLORS.warning)

    recoveryOpps.forEach((opp: any) => {
      y = checkNewPage(doc, y, 20)

      const strength = opp.strength === 'strong'   ? 'Stark'   :
                       opp.strength === 'moderate'  ? 'Moderat' : 'Schwach'
      const strColor = opp.strength === 'strong'   ? COLORS.success :
                       opp.strength === 'moderate'  ? COLORS.warning : COLORS.gray

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...strColor)
      doc.text(`[${strength}]`, 20, y)

      doc.setTextColor(...COLORS.dark)
      const qLabel = opp.question ? `Frage: ${opp.question}` : ''
      const pts = (opp.currentPoints != null && opp.possiblePoints != null)
        ? ` (${opp.currentPoints} → ${opp.possiblePoints} Pkt.)` : ''
      doc.setFont('helvetica', 'bold')
      doc.text(`${qLabel}${pts}`, 48, y)
      y += 5

      if (opp.argument) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        const argLines = doc.splitTextToSize(opp.argument, pageWidth - 45)
        doc.text(argLines, 25, y)
        y += argLines.length * 4 + 2
      }

      y += 2
    })

    if (fa.totalPotentialRecovery) {
      y = checkNewPage(doc, y, 12)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...COLORS.warning)
      doc.text(`Gesamt-Potenzial: ${fa.totalPotentialRecovery}`, 20, y)
      doc.setTextColor(...COLORS.dark)
      y += 8
    }

    y += 3
  }

  // ── Recommendation ────────────────────────────────────────────
  if (recommendation.approach || recommendation.shouldContactTeacher != null) {
    y = checkNewPage(doc, y, 50)
    y = addSectionTitle(doc, 'Empfehlung', y, COLORS.success)

    doc.setFontSize(10)

    if (recommendation.shouldContactTeacher) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.secondary)
      doc.text('Gespräch mit Lehrer empfohlen', 20, y)
      if (recommendation.urgency) {
        const urgLabel = recommendation.urgency === 'high' ? 'Dringend' :
                         recommendation.urgency === 'medium' ? 'Bald' : 'Optional'
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Dringlichkeit: ${urgLabel}`, pageWidth - 20, y, { align: 'right' })
      }
    } else {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.success)
      doc.text('Kein Gespräch notwendig', 20, y)
    }
    y += 7

    if (recommendation.approach) {
      doc.setTextColor(...COLORS.dark)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const approachLines = doc.splitTextToSize(recommendation.approach, pageWidth - 40)
      doc.text(approachLines, 20, y)
      y += approachLines.length * 4.5 + 4
    }

    if (recommendation.specificPoints && recommendation.specificPoints.length > 0) {
      y = checkNewPage(doc, y, 20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.dark)
      doc.text('Konkrete Punkte ansprechen:', 20, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      recommendation.specificPoints.forEach((pt: string) => {
        y = checkNewPage(doc, y, 8)
        const ptLines = doc.splitTextToSize(`• ${pt}`, pageWidth - 45)
        doc.text(ptLines, 25, y)
        y += ptLines.length * 4.5
      })
      y += 3
    }

    if (recommendation.sampleOpener) {
      y = checkNewPage(doc, y, 20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.primary)
      doc.text('Gesprächseinstieg:', 20, y)
      y += 5
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...COLORS.dark)
      const openerLines = doc.splitTextToSize(`"${recommendation.sampleOpener}"`, pageWidth - 45)
      doc.text(openerLines, 25, y)
      y += openerLines.length * 4.5 + 4
    }
  }

  // ── Disclaimer ────────────────────────────────────────────────
  y = checkNewPage(doc, y, 20)
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.gray)
  doc.text(
    'Diese Analyse dient nur zur Orientierung. Im Zweifel sprechen Sie direkt mit dem Lehrer.',
    pageWidth / 2,
    y + 10,
    { align: 'center' }
  )

  // Footers on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

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
  const totalPages = doc.getNumberOfPages()
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

// ============================================
// PARENT REPORT PDF
// ============================================

export function generateReportPDF(reportData: any, options: PDFOptions = {}): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = addHeader(doc, 'Elternbericht', options)

  const grade = reportData?.grade?.value || '—'
  const subject = reportData?.test?.subject || options.subject || ''
  const studentName = reportData?.student?.name || options.childName || ''
  const date = reportData?.test?.date || options.date || new Date().toLocaleDateString('de-DE')

  // ── Student / Grade summary box ───────────────────────────────
  doc.setFillColor(...COLORS.light)
  doc.roundedRect(15, y, pageWidth - 30, 28, 3, 3, 'F')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.dark)
  doc.text(studentName || 'Schüler/in', 20, y + 8)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.gray)
  const meta = [subject, reportData?.student?.class, date].filter(Boolean).join(' · ')
  doc.text(meta, 20, y + 14)

  // Grade badge
  const gradeStr = String(grade)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text(gradeStr, pageWidth - 20, y + 16, { align: 'right' })

  if (reportData?.grade?.description) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.gray)
    doc.text(reportData.grade.description, pageWidth - 20, y + 22, { align: 'right' })
  }

  doc.setTextColor(...COLORS.dark)
  y += 35

  // ── Message to parents ─────────────────────────────────────────
  if (reportData?.messages?.toParents) {
    y = checkNewPage(doc, y, 25)
    y = addSectionTitle(doc, 'Nachricht an die Eltern', y, COLORS.primary)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(reportData.messages.toParents, pageWidth - 40)
    doc.text(lines, 20, y)
    y += lines.length * 4.5 + 6
  }

  // ── Summary ───────────────────────────────────────────────────
  const summaryText = typeof reportData?.summary === 'string'
    ? reportData.summary
    : reportData?.summary?.oneSentence
  const keyTakeaways: string[] = reportData?.summary?.keyTakeaways || []
  const nextStep: string = reportData?.summary?.nextStep || ''

  if (summaryText || keyTakeaways.length > 0) {
    y = checkNewPage(doc, y, 30)
    y = addSectionTitle(doc, 'Das Wichtigste auf einen Blick', y, COLORS.secondary)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (summaryText) {
      const sl = doc.splitTextToSize(summaryText, pageWidth - 40)
      doc.text(sl, 20, y)
      y += sl.length * 4.5 + 4
    }
    keyTakeaways.forEach((point) => {
      y = checkNewPage(doc, y, 8)
      const pl = doc.splitTextToSize(`• ${point}`, pageWidth - 45)
      doc.text(pl, 22, y)
      y += pl.length * 4.5
    })
    if (nextStep) {
      y = checkNewPage(doc, y, 10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.primary)
      const nl = doc.splitTextToSize(`→ Nächster Schritt: ${nextStep}`, pageWidth - 40)
      doc.text(nl, 20, y)
      doc.setTextColor(...COLORS.dark)
      y += nl.length * 4.5 + 4
    }
    doc.setFont('helvetica', 'normal')
    y += 3
  }

  // ── Strengths ─────────────────────────────────────────────────
  const strengths: any[] = reportData?.strengths || []
  if (strengths.length > 0) {
    y = checkNewPage(doc, y, 30)
    y = addSectionTitle(doc, 'Stärken', y, COLORS.success)
    doc.setFontSize(9)
    strengths.slice(0, 5).forEach((s: any) => {
      y = checkNewPage(doc, y, 12)
      const title = typeof s === 'string' ? s : (s.title || s.point || '')
      const desc = typeof s === 'string' ? '' : (s.description || s.evidence || '')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.success)
      doc.text('✓', 20, y)
      doc.setTextColor(...COLORS.dark)
      const tl = doc.splitTextToSize(title, pageWidth - 45)
      doc.text(tl, 28, y)
      y += tl.length * 4.5
      if (desc) {
        doc.setFont('helvetica', 'normal')
        const dl = doc.splitTextToSize(desc, pageWidth - 45)
        doc.text(dl, 28, y)
        y += dl.length * 4 + 2
      }
    })
    y += 3
  }

  // ── Weaknesses ────────────────────────────────────────────────
  const weaknesses: any[] = reportData?.weaknesses || []
  if (weaknesses.length > 0) {
    y = checkNewPage(doc, y, 30)
    y = addSectionTitle(doc, 'Verbesserungsbereiche', y, COLORS.warning)
    doc.setFontSize(9)
    weaknesses.slice(0, 5).forEach((w: any) => {
      y = checkNewPage(doc, y, 12)
      const title = typeof w === 'string' ? w : (w.title || w.point || '')
      const desc = typeof w === 'string' ? '' : (w.description || w.rootCause || w.example || '')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.warning)
      doc.text('!', 20, y)
      doc.setTextColor(...COLORS.dark)
      const tl = doc.splitTextToSize(title, pageWidth - 45)
      doc.text(tl, 28, y)
      y += tl.length * 4.5
      if (desc) {
        doc.setFont('helvetica', 'normal')
        const dl = doc.splitTextToSize(desc, pageWidth - 45)
        doc.text(dl, 28, y)
        y += dl.length * 4 + 2
      }
    })
    y += 3
  }

  // ── Immediate Action Plan ─────────────────────────────────────
  const immediate = reportData?.actionPlan?.immediate
  if (immediate) {
    y = checkNewPage(doc, y, 40)
    y = addSectionTitle(doc, 'Sofortmaßnahmen', y, COLORS.primary)
    doc.setFontSize(9)
    if (immediate.goal) {
      doc.setFont('helvetica', 'bold')
      const gl = doc.splitTextToSize(`Ziel: ${immediate.goal}`, pageWidth - 40)
      doc.text(gl, 20, y)
      y += gl.length * 4.5 + 3
    }
    const activities: any[] = immediate.activities || []
    activities.slice(0, 5).forEach((act: any) => {
      y = checkNewPage(doc, y, 12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.secondary)
      doc.text(`${act.day || ''}`, 20, y)
      doc.setTextColor(...COLORS.dark)
      doc.setFont('helvetica', 'normal')
      const taskStr = `${act.task || ''}${act.duration ? ` (${act.duration})` : ''}`
      const tl = doc.splitTextToSize(taskStr, pageWidth - 55)
      doc.text(tl, 45, y)
      y += tl.length * 4.5
    })
    y += 3
  }

  // ── Footer on all pages ────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addHeader(doc, 'Elternbericht', options)
    addFooter(doc, i)
  }

  doc.save(`GradeAI_Elternbericht_${options.childName || 'Export'}.pdf`)
}
