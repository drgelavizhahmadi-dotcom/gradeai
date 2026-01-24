// Design System Constants
// Use these constants throughout the app for consistent styling

export const colors = {
  // Primary gradient
  gradientFrom: 'from-blue-600',
  gradientTo: 'to-indigo-600',
  gradientHoverFrom: 'hover:from-blue-700',
  gradientHoverTo: 'hover:to-indigo-700',

  // Background gradients
  bgGradient: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',

  // Button variants
  primaryButton: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
  secondaryButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  dangerButton: 'bg-red-50 hover:bg-red-100 text-red-700',

  // Status colors
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
}

export const spacing = {
  // Container padding
  containerPx: 'px-4 sm:px-6 lg:px-8',
  containerPy: 'py-8',
  containerPyLarge: 'py-12',

  // Section spacing
  sectionMb: 'mb-8',
  sectionMbSmall: 'mb-6',

  // Card padding
  cardP: 'p-6',
  cardPLarge: 'p-8 sm:p-12',
}

export const typography = {
  // Headings
  h1: 'text-3xl font-bold text-gray-900 sm:text-4xl',
  h2: 'text-2xl font-bold text-gray-900',
  h3: 'text-xl font-semibold text-gray-900',
  h4: 'text-lg font-semibold text-gray-900',

  // Body text
  body: 'text-base text-gray-600',
  bodyLarge: 'text-lg text-gray-600',
  bodySmall: 'text-sm text-gray-600',

  // Labels
  label: 'text-sm font-semibold text-gray-700',
  helperText: 'text-xs text-gray-500',
}

export const borderRadius = {
  small: 'rounded-lg',
  medium: 'rounded-xl',
  large: 'rounded-2xl',
  full: 'rounded-full',
}

export const shadows = {
  small: 'shadow-sm',
  medium: 'shadow-md',
  large: 'shadow-lg',
  xlarge: 'shadow-xl',
  hover: 'hover:shadow-xl',
}

export const transitions = {
  default: 'transition-colors',
  all: 'transition-all',
  fast: 'transition-all duration-150',
  slow: 'transition-all duration-300',
}

// Grade color system (German grading: 1.0 = best, 6.0 = worst)
export const gradeColors = {
  excellent: 'text-green-700 bg-green-50 border-green-200', // 1.0-2.0
  good: 'text-blue-700 bg-blue-50 border-blue-200',       // 2.0-3.0
  satisfactory: 'text-amber-700 bg-amber-50 border-amber-200', // 3.0-4.0
  poor: 'text-red-700 bg-red-50 border-red-200',          // 4.0+
}

export function getGradeColor(grade: number): string {
  if (grade <= 2.0) return gradeColors.excellent
  if (grade <= 3.0) return gradeColors.good
  if (grade <= 4.0) return gradeColors.satisfactory
  return gradeColors.poor
}

// Consistent spacing values
export const gridGap = 'gap-6'
export const gridCols = {
  mobile: 'grid-cols-1',
  tablet: 'sm:grid-cols-2',
  desktop: 'lg:grid-cols-3',
  full: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

// Common class combinations
export const buttonBase = 'inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all shadow-lg hover:shadow-xl'
export const cardBase = 'rounded-xl bg-white shadow-md border border-gray-200'
export const inputBase = 'block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
