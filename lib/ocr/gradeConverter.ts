/**
 * Converts German grade notation to numeric value
 *
 * German grading scale:
 * - 1 (sehr gut) = very good
 * - 2 (gut) = good
 * - 3 (befriedigend) = satisfactory
 * - 4 (ausreichend) = sufficient
 * - 5 (mangelhaft) = poor
 * - 6 (ungenügend) = insufficient
 *
 * Modifiers:
 * - "+" (plus) improves grade by 0.3 (e.g., "2+" = 1.7)
 * - "-" (minus) worsens grade by 0.3 (e.g., "2-" = 2.3)
 *
 * @param gradeString - The grade string (e.g., "2-", "3+", "2,5")
 * @returns The numeric grade value or null if invalid
 */
export function convertGermanGrade(gradeString: string | null): number | null {
  if (!gradeString) {
    return null
  }

  const trimmed = gradeString.trim()

  // Handle plus notation (improves grade)
  if (trimmed.includes('+')) {
    const baseGrade = parseInt(trimmed.replace('+', ''))
    if (isNaN(baseGrade) || baseGrade < 1 || baseGrade > 6) {
      return null
    }
    return Math.max(1.0, baseGrade - 0.3)
  }

  // Handle minus notation (worsens grade)
  if (trimmed.includes('-')) {
    const baseGrade = parseInt(trimmed.replace('-', ''))
    if (isNaN(baseGrade) || baseGrade < 1 || baseGrade > 6) {
      return null
    }
    return Math.min(6.0, baseGrade + 0.3)
  }

  // Handle decimal notation (2,5 or 2.5)
  const normalized = trimmed.replace(',', '.')
  const numericGrade = parseFloat(normalized)

  if (isNaN(numericGrade) || numericGrade < 1.0 || numericGrade > 6.0) {
    return null
  }

  return numericGrade
}

/**
 * Converts numeric grade back to German notation
 *
 * @param numericGrade - The numeric grade (1.0 to 6.0)
 * @returns The German grade notation (e.g., "2-", "3+", "2.5")
 */
export function formatGermanGrade(numericGrade: number | null): string | null {
  if (numericGrade === null || isNaN(numericGrade)) {
    return null
  }

  if (numericGrade < 1.0 || numericGrade > 6.0) {
    return null
  }

  // Check if it's a whole number
  if (Number.isInteger(numericGrade)) {
    return numericGrade.toString()
  }

  // Check for plus/minus notation (x.3 or x.7)
  const baseGrade = Math.floor(numericGrade)
  const decimal = numericGrade - baseGrade

  if (Math.abs(decimal - 0.3) < 0.01) {
    // x.3 = base grade with minus
    return `${baseGrade}-`
  } else if (Math.abs(decimal - 0.7) < 0.01) {
    // x.7 = (base grade + 1) with plus
    return `${baseGrade}+`
  }

  // Otherwise, return as decimal
  return numericGrade.toFixed(1)
}

/**
 * Gets the German grade description
 *
 * @param numericGrade - The numeric grade (1.0 to 6.0)
 * @returns The German description
 */
export function getGradeDescription(numericGrade: number | null): string | null {
  if (numericGrade === null || isNaN(numericGrade)) {
    return null
  }

  if (numericGrade >= 1.0 && numericGrade < 1.5) {
    return 'sehr gut'
  } else if (numericGrade >= 1.5 && numericGrade < 2.5) {
    return 'gut'
  } else if (numericGrade >= 2.5 && numericGrade < 3.5) {
    return 'befriedigend'
  } else if (numericGrade >= 3.5 && numericGrade < 4.5) {
    return 'ausreichend'
  } else if (numericGrade >= 4.5 && numericGrade < 5.5) {
    return 'mangelhaft'
  } else if (numericGrade >= 5.5 && numericGrade <= 6.0) {
    return 'ungenügend'
  }

  return null
}
