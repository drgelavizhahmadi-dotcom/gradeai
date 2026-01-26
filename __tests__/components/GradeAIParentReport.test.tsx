/**
 * Component Tests for GradeAIParentReport
 */

import { render, screen } from '@testing-library/react'
import GradeAIParentReport from '@/components/GradeAIParentReport'
import { LanguageProvider } from '@/components/providers/LanguageProvider'

// Mock the translation hook
jest.mock('@/components/GradeAIParentReport/useReportTranslation', () => ({
  useReportTranslation: (data: any) => ({
    translatedData: data,
    isTranslating: false,
    error: null,
    retranslate: jest.fn(),
  }),
}))

// Mock the language context
jest.mock('@/components/GradeAIParentReport/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLanguage: () => ({
    language: 'en',
    targetLanguage: 'en',
    isRTL: false,
    setLanguage: jest.fn(),
  }),
}))

describe('GradeAIParentReport Component', () => {
  const mockReportData = {
    studentName: 'John Doe',
    studentGrade: '5',
    schoolYear: '2023-2024',
    testDate: '2024-01-15',
    overallAssessment: {
      grade: 'B',
      description: 'Good performance overall',
      strengths: ['Strong in math', 'Good reading comprehension'],
      areasForImprovement: ['Could improve writing skills'],
    },
    subjectAnalysis: [
      {
        subject: 'Mathematics',
        grade: 'A',
        description: 'Excellent understanding of concepts',
        topics: [
          {
            name: 'Algebra',
            performance: 'Excellent',
            details: 'Solved all problems correctly',
          },
        ],
      },
      {
        subject: 'English',
        grade: 'B',
        description: 'Good comprehension but needs work on grammar',
        topics: [
          {
            name: 'Reading',
            performance: 'Good',
            details: 'Understood main ideas well',
          },
        ],
      },
    ],
    recommendations: [
      'Continue practicing math problems daily',
      'Focus on grammar exercises',
    ],
  }

  test('renders without crashing', () => {
    render(
      <GradeAIParentReport analysisData={mockReportData} />
    )

    // Check for the main heading specifically
    expect(screen.getByRole('heading', { name: /GradeAI Elternbericht/i })).toBeInTheDocument()
  })

  test('handles empty report data gracefully', () => {
    const emptyReport = {
      studentName: '',
      studentGrade: '',
      schoolYear: '',
      testDate: '',
      overallAssessment: {
        grade: '',
        description: '',
        strengths: [],
        areasForImprovement: [],
      },
      subjectAnalysis: [],
      recommendations: [],
    }

    render(
      <GradeAIParentReport analysisData={emptyReport} />
    )

    expect(screen.getByRole('heading', { name: /GradeAI Elternbericht/i })).toBeInTheDocument()
  })

  test('handles missing optional fields', () => {
    const minimalReport = {
      studentName: 'Jane Smith',
      studentGrade: '3',
      schoolYear: '2023-2024',
      testDate: '2024-01-15',
      overallAssessment: {
        grade: 'A',
        description: 'Excellent work',
        strengths: [],
        areasForImprovement: [],
      },
      subjectAnalysis: [],
      recommendations: [],
    }

    render(
      <GradeAIParentReport analysisData={minimalReport} />
    )

    expect(screen.getByRole('heading', { name: /GradeAI Elternbericht/i })).toBeInTheDocument()
  })
})