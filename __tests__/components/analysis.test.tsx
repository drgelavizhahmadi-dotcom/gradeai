/**
 * Component Tests for Analysis Display Components
 */

import { render, screen, waitFor } from '@testing-library/react'
import AnalysisDisplay from '@/components/AnalysisDisplay'
import ComprehensiveAnalysis from '@/components/ComprehensiveAnalysis'
import { LanguageProvider } from '@/components/providers/LanguageProvider'

// Redundant mock removed - using global mock from jest.setup.ts

// Mock the analysis data
const mockAnalysisData = {
  id: 'test-analysis-id',
  summary: {
    grade: 'A',
    subject: 'Mathematics',
    overallGrade: 'A',
  },
  performance: {
    topics: [
      {
        name: 'Algebra',
        performance: 'Excellent',
        details: 'Student solved all equations correctly',
      },
      {
        name: 'Geometry',
        performance: 'Good',
        details: 'Understood basic concepts but needs practice with proofs',
      },
    ],
  },
  overallFeedback: 'Strong performance in mathematics fundamentals',
  recommendations: [
    { action: 'Continue practicing algebraic equations', priority: 'high', timeframe: '1 week' },
    { action: 'Work on geometry proofs', priority: 'medium', timeframe: '2 weeks' },
  ],
  strengths: ['Algebra', 'Mental math'],
  weaknesses: ['Geometry proofs'],
}

const mockComprehensiveAnalysis = {
  studentName: 'John Doe',
  studentGrade: '5',
  schoolYear: '2023-2024',
  testDate: '2024-01-15',
  summary: {
    overallGrade: 'B+',
    subject: 'Mathematics',
    description: 'Good overall performance with room for improvement',
  },
  performance: {
    subjectAnalysis: [
      {
        subject: 'Mathematics',
        grade: 'A',
        description: 'Excellent mathematical reasoning',
        topics: [
          {
            name: 'Arithmetic',
            performance: 'Excellent',
            details: 'Perfect score on all arithmetic problems',
          },
        ],
      },
      {
        subject: 'Science',
        grade: 'B',
        description: 'Good understanding but needs more practice',
        topics: [
          {
            name: 'Physics',
            performance: 'Good',
            details: 'Understands basic principles',
          },
        ],
      },
    ],
  },
  strengths: ['Strong problem-solving skills', 'Good understanding of concepts'],
  weaknesses: ['Time management', 'Attention to detail'],
  recommendations: [
    { action: 'Focus on time management during tests', priority: 'high', timeframe: '1 week' },
    { action: 'Practice detailed problem-solving', priority: 'medium', timeframe: 'ongoing' },
  ],
}

describe('AnalysisDisplay Component', () => {
  test('renders analysis data correctly', () => {
    render(
      <LanguageProvider>
        <AnalysisDisplay analysis={mockAnalysisData} />
      </LanguageProvider>
    )

    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText(/A/)).toBeInTheDocument()
    expect(screen.getByText('Algebra')).toBeInTheDocument()
    expect(screen.getByText('Excellent')).toBeInTheDocument()
    expect(screen.getByText('Geometry')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  test('displays recommendations', () => {
    render(
      <LanguageProvider>
        <AnalysisDisplay analysis={mockAnalysisData} />
      </LanguageProvider>
    )

    expect(screen.getByText('Continue practicing algebraic equations')).toBeInTheDocument()
    expect(screen.getByText('Work on geometry proofs')).toBeInTheDocument()
  })

  test('handles empty analysis gracefully', () => {
    const emptyAnalysis = {
      id: 'empty',
      summary: {
        overallGrade: '',
        subject: '',
      },
      performance: {
        topics: [],
      },
      overallFeedback: '',
      recommendations: [],
    }

    render(
      <LanguageProvider>
        <AnalysisDisplay analysis={emptyAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('Analysis Results')).toBeInTheDocument()
  })

  test('handles missing topics', () => {
    const noTopicsAnalysis = {
      ...mockAnalysisData,
      performance: {
        topics: [],
      },
    }

    render(
      <LanguageProvider>
        <AnalysisDisplay analysis={noTopicsAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.queryByText('Algebra')).not.toBeInTheDocument()
  })
})

describe('ComprehensiveAnalysis Component', () => {
  test('renders comprehensive analysis correctly', () => {
    render(
      <LanguageProvider>
        <ComprehensiveAnalysis analysis={mockComprehensiveAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText(/Grade 5/)).toBeInTheDocument()
    expect(screen.getByText('2023-2024')).toBeInTheDocument()
    expect(screen.getByText('B+')).toBeInTheDocument()
    expect(screen.getByText('Good overall performance with room for improvement')).toBeInTheDocument()
  })

  test('displays subject analysis sections', () => {
    render(
      <LanguageProvider>
        <ComprehensiveAnalysis analysis={mockComprehensiveAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByText(/A/)).toBeInTheDocument()
    expect(screen.getByText('Science')).toBeInTheDocument()
    expect(screen.getByText(/B/)).toBeInTheDocument()
  })

  test('displays strengths and areas for improvement', () => {
    render(
      <LanguageProvider>
        <ComprehensiveAnalysis analysis={mockComprehensiveAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('Strong problem-solving skills')).toBeInTheDocument()
    expect(screen.getByText('Good understanding of concepts')).toBeInTheDocument()
    expect(screen.getByText('Time management')).toBeInTheDocument()
    expect(screen.getByText('Attention to detail')).toBeInTheDocument()
  })

  test('displays recommendations', () => {
    render(
      <LanguageProvider>
        <ComprehensiveAnalysis analysis={mockComprehensiveAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('Focus on time management during tests')).toBeInTheDocument()
    expect(screen.getByText('Practice detailed problem-solving')).toBeInTheDocument()
  })

  test('handles empty comprehensive analysis', () => {
    const emptyAnalysis = {
      studentName: '',
      studentGrade: '',
      schoolYear: '',
      testDate: '',
      summary: {
        overallGrade: '',
        description: '',
      },
      strengths: [],
      weaknesses: [],
      recommendations: [],
    }

    render(
      <LanguageProvider>
        <ComprehensiveAnalysis analysis={emptyAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('Comprehensive Analysis')).toBeInTheDocument()
  })

  test('handles missing optional fields', () => {
    const minimalAnalysis = {
      studentName: 'Jane Smith',
      studentGrade: '3',
      schoolYear: '2023-2024',
      testDate: '2024-01-15',
      summary: {
        overallGrade: 'A',
        description: 'Excellent work',
      },
      strengths: [],
      weaknesses: [],
      recommendations: [],
    }

    render(
      <LanguageProvider>
        <ComprehensiveAnalysis analysis={minimalAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText(/Grade 3/)).toBeInTheDocument()
    expect(screen.getByText('Excellent work')).toBeInTheDocument()
  })
})