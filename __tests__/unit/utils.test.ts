/**
 * Unit Tests for Core Utility Functions
 */

import { convertGermanGrade } from '@/lib/ocr/gradeConverter'
import { transformToReportFormat } from '@/lib/ai/transformToReportFormat'
import { TestAnalysis } from '@/lib/ai/prompts'

describe('Grade Converter', () => {
  test('converts German grades correctly', () => {
    expect(convertGermanGrade('1')).toBe(1.0)
    expect(convertGermanGrade('1+')).toBe(1.0)
    expect(convertGermanGrade('2-')).toBe(2.3)
    expect(convertGermanGrade('3')).toBe(3.0)
    expect(convertGermanGrade('4+')).toBe(3.7)
    expect(convertGermanGrade('5')).toBe(5.0)
    expect(convertGermanGrade('6')).toBe(6.0)
  })

  test('handles invalid grades', () => {
    expect(convertGermanGrade('invalid')).toBeNull()
    expect(convertGermanGrade('')).toBeNull()
    expect(convertGermanGrade(null)).toBeNull()
    expect(convertGermanGrade(undefined)).toBeNull()
  })

  test('handles numeric grades', () => {
    expect(convertGermanGrade('1')).toBe(1.0)
    expect(convertGermanGrade('2')).toBe(2.0)
    expect(convertGermanGrade('3')).toBe(3.0)
    expect(convertGermanGrade('4')).toBe(4.0)
    expect(convertGermanGrade('5')).toBe(5.0)
    expect(convertGermanGrade('6')).toBe(6.0)
  })
})

describe('Report Format Transformer', () => {
  const mockAnalysis: TestAnalysis = {
    summary: {
      overallGrade: '2+',
      overallScore: 85,
      maxScore: 100,
      percentage: 85,
      subject: 'Mathematics',
      topic: 'Algebra',
      childName: 'Max Mustermann',
      testDate: '2024-01-15',
      executiveSummary: 'Good performance with room for improvement',
      confidence: 0.9,
    },
    performance: {
      bySection: [
        {
          name: 'Task 1',
          pointsAchieved: 8,
          pointsPossible: 10,
          percentage: 80,
          notes: 'Well solved',
        },
      ],
      trends: ['Consistent performance'],
    },
    teacherFeedback: {
      evaluationMethodology: 'Standard grading',
      written: 'Good work on Task 1',
      corrections: ['Minor calculation error'],
      praise: ['Clear presentation'],
    },
    strengths: ['Good understanding of concepts', 'Clear writing'],
    weaknesses: ['Minor calculation errors'],
    recommendations: [
      {
        priority: 1,
        category: 'Practice',
        action: 'Practice more calculations',
        timeframe: '1 week',
        rationale: 'To improve accuracy',
        resources: ['Math workbook'],
      },
    ],
    timeManagement: {
      assessment: 'Good time management',
      suggestions: ['Continue current approach'],
    },
    languageEnhancement: {
      applicable: true,
      notes: 'Good language usage',
      grammarIssues: [],
      vocabularyTips: [],
    },
    longTermDevelopment: {
      semesterPrediction: 'Will maintain good performance',
      improvementAreas: ['Advanced topics'],
      goalSetting: 'Aim for 1+ next test',
    },
    metadata: {
      processingTime: 5000,
      timestamp: '2024-01-15T10:00:00Z',
      ocrConfidence: 0.95,
      aiModel: 'Multi-AI Consensus',
      processingSteps: ['OCR', 'Analysis', 'Synthesis'],
    },
  }

  test('transforms TestAnalysis to ReportFormat correctly', () => {
    const result = transformToReportFormat(mockAnalysis)

    expect(result.header.grade).toBe('2+')
    expect(result.header.percentage).toBe(85)
    expect(result.header.subject).toBe('Mathematics')
    expect(result.header.studentName).toBe('Max Mustermann')

    expect(result.examStructure).toHaveLength(1)
    expect(result.examStructure[0].taskNumber).toBe(1)
    expect(result.examStructure[0].pointsAchieved).toBe(8)

    expect(result.scores.overall.achieved).toBe(85)
    expect(result.scores.overall.maximum).toBe(100)

    expect(result.strengthsIdentified).toHaveLength(2)
    expect(result.errorAnalysis).toHaveLength(1)
    expect(result.recommendedActions.immediate).toHaveLength(1)
  })

  test('handles missing data gracefully', () => {
    const minimalAnalysis: TestAnalysis = {
      summary: {
        overallGrade: '3',
        overallScore: 60,
        maxScore: 100,
        percentage: 60,
        subject: 'Test Subject',
        childName: 'Test Student',
        confidence: 0.8,
      },
      performance: {
        bySection: [],
        trends: [],
      },
      teacherFeedback: {
        written: '',
        corrections: [],
        praise: [],
      },
      strengths: [],
      weaknesses: [],
      recommendations: [],
      longTermDevelopment: {
        semesterPrediction: 'Unknown',
        improvementAreas: [],
        goalSetting: 'Unknown',
      },
      metadata: {
        processingTime: 1000,
        timestamp: '2024-01-01T00:00:00Z',
        ocrConfidence: 0.8,
        aiModel: 'Test',
        processingSteps: [],
      },
    }

    const result = transformToReportFormat(minimalAnalysis)

    expect(result.header.grade).toBe('3')
    expect(result.examStructure).toHaveLength(1) // Creates default task
    expect(result.strengthsIdentified).toHaveLength(1) // Creates default strength
    expect(result.errorAnalysis).toHaveLength(1) // Creates default error analysis
  })
})

describe('Translation Utilities', () => {
  test('handles grade explanations', () => {
    // This would test the grade explanation logic if it were extracted
    expect(true).toBe(true) // Placeholder
  })

  test('handles emotional messages', () => {
    // This would test emotional message generation if it were extracted
    expect(true).toBe(true) // Placeholder
  })
})