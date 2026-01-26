/**
 * Component Tests for Analysis Display Components
 */

import { render, screen, waitFor } from '@testing-library/react'
import AnalysisDisplay from '@/components/AnalysisDisplay'
import ComprehensiveAnalysis from '@/components/ComprehensiveAnalysis'
import { LanguageProvider } from '@/components/providers/LanguageProvider'

// Mock the useLanguage hook to return English translations
jest.mock('@/components/providers/LanguageProvider', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLanguage: () => ({
    t: {
      analysis: {
        comprehensive: 'Comprehensive Analysis',
        strengths: 'Strengths',
        weaknesses: 'Weaknesses',
        recommendations: 'Recommendations',
        subject: 'Subject',
        grade: 'Grade',
        detectedGrade: 'Detected Grade',
        ocrConfidence: 'AI Confidence',
        howAnalyzed: 'How it was analyzed',
        aiExperts: 'AI Experts',
        consensusScore: 'Consensus Score',
        visualEvidence: 'Visual Evidence',
        extractedText: 'Extracted Text',
        points: 'Points',
        correctionDensity: 'Correction Density',
        teacherComment: 'Teacher Comments',
        marks: 'Marks',
        priority: 'Priority',
        timeframe: 'Timeframe',
      },
      upload: {
        subject: 'Subject',
      },
    },
    language: 'en',
    setLanguage: jest.fn(),
  }),
}))

// Mock the analysis data
const mockAnalysisData = {
  id: 'test-analysis-id',
  grade: 'A',
  subject: 'Mathematics',
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
  overallFeedback: 'Strong performance in mathematics fundamentals',
  recommendations: [
    'Continue practicing algebraic equations',
    'Work on geometry proofs',
  ],
}

const mockComprehensiveAnalysis = {
  studentName: 'John Doe',
  studentGrade: '5',
  schoolYear: '2023-2024',
  testDate: '2024-01-15',
  overallAssessment: {
    grade: 'B+',
    description: 'Good overall performance with room for improvement',
    strengths: ['Strong problem-solving skills', 'Good understanding of concepts'],
    areasForImprovement: ['Time management', 'Attention to detail'],
  },
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
  recommendations: [
    'Focus on time management during tests',
    'Practice detailed problem-solving',
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
    expect(screen.getByText('Grade: A')).toBeInTheDocument()
    expect(screen.getByText('Algebra')).toBeInTheDocument()
    expect(screen.getByText('Excellent')).toBeInTheDocument()
    expect(screen.getByText('Geometry')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Strong performance in mathematics fundamentals')).toBeInTheDocument()
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
      grade: '',
      subject: '',
      topics: [],
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
      topics: [],
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
    expect(screen.getByText('Grade 5')).toBeInTheDocument()
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
    expect(screen.getByText('Grade: A')).toBeInTheDocument()
    expect(screen.getByText('Science')).toBeInTheDocument()
    expect(screen.getByText('Grade: B')).toBeInTheDocument()
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
      <LanguageProvider>
        <ComprehensiveAnalysis analysis={minimalAnalysis} />
      </LanguageProvider>
    )

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Grade 3')).toBeInTheDocument()
    expect(screen.getByText('Excellent work')).toBeInTheDocument()
  })
})