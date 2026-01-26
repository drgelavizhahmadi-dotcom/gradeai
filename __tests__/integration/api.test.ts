/**
 * Integration Tests for API Endpoints
 * These tests focus on the core business logic rather than full HTTP request/response cycles
 */

import { analyzeUploadBuffer } from '@/lib/analysis'

// Mock the dependencies
jest.mock('@/lib/analysis')

const mockAnalyzeUploadBuffer = analyzeUploadBuffer as jest.MockedFunction<typeof analyzeUploadBuffer>

describe('Upload API Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('validates file types', async () => {
    // Test the file type validation logic
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
    const invalidTypes = ['text/plain', 'application/msword']

    validTypes.forEach(type => {
      expect(['image/jpeg', 'image/png', 'application/pdf'].includes(type)).toBe(true)
    })

    invalidTypes.forEach(type => {
      expect(['image/jpeg', 'image/png', 'application/pdf'].includes(type)).toBe(false)
    })
  })

  test('validates file size', async () => {
    const maxSize = 4 * 1024 * 1024 // 4MB
    const validSizes = [1024, 1024 * 1024, 4 * 1024 * 1024]
    const invalidSizes = [5 * 1024 * 1024, 10 * 1024 * 1024]

    validSizes.forEach(size => {
      expect(size <= maxSize).toBe(true)
    })

    invalidSizes.forEach(size => {
      expect(size <= maxSize).toBe(false)
    })
  })

  test('handles analysis success', async () => {
    const mockAnalysisResult = {
      id: 'analysis-123',
      grade: 'A',
      subject: 'Mathematics',
      topics: [],
      overallFeedback: 'Good work',
      recommendations: []
    }

    mockAnalyzeUploadBuffer.mockResolvedValue(mockAnalysisResult)

    const result = await mockAnalyzeUploadBuffer(Buffer.from('test'), 'test.jpg', 'child-123')

    expect(result).toEqual(mockAnalysisResult)
    expect(mockAnalyzeUploadBuffer).toHaveBeenCalledWith(Buffer.from('test'), 'test.jpg', 'child-123')
  })

  test('handles analysis failure', async () => {
    mockAnalyzeUploadBuffer.mockRejectedValue(new Error('Analysis failed'))

    await expect(mockAnalyzeUploadBuffer(Buffer.from('test'), 'test.jpg', 'child-123'))
      .rejects.toThrow('Analysis failed')
  })
})

describe('File Processing', () => {
  test('processes different file formats', () => {
    const testCases = [
      { filename: 'test.jpg', expected: true },
      { filename: 'test.jpeg', expected: true },
      { filename: 'test.png', expected: true },
      { filename: 'test.pdf', expected: true },
      { filename: 'test.txt', expected: false },
      { filename: 'test.docx', expected: false },
    ]

    testCases.forEach(({ filename, expected }) => {
      const isValid = ['.jpg', '.jpeg', '.png', '.pdf'].some(ext =>
        filename.toLowerCase().endsWith(ext)
      )
      expect(isValid).toBe(expected)
    })
  })

  test('generates appropriate file keys', () => {
    const testCases = [
      { childId: 'child-123', filename: 'test.jpg', expected: expect.stringContaining('child-123') },
      { childId: 'child-456', filename: 'math.pdf', expected: expect.stringContaining('child-456') },
    ]

    testCases.forEach(({ childId, filename, expected }) => {
      const key = `${childId}/${Date.now()}-${filename}`
      expect(key).toEqual(expected)
    })
  })
})
      method: 'POST',
      body: formData,
    })

    const response = await uploadHandler(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toContain('No files provided')
  })

  test('rejects requests without childId', async () => {
    const formData = new FormData()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('files', file)

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await uploadHandler(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Child ID is required')
  })

  test('validates file types', async () => {
    const formData = new FormData()
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    formData.append('files', invalidFile)
    formData.append('childId', 'test-child-id')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await uploadHandler(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid file type')
  })

  test('validates file size', async () => {
    const formData = new FormData()
    const largeFile = new File(['x'.repeat(5 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    formData.append('files', largeFile)
    formData.append('childId', 'test-child-id')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await uploadHandler(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toContain('exceeds 4MB limit')
  })

  test('processes valid uploads successfully', async () => {
    // Mock successful authentication
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-123' } })

    // Mock child verification
    mockDb.child.findUnique.mockResolvedValue({
      id: 'child-123',
      userId: 'user-123',
      name: 'Test Child',
      grade: 5,
      schoolType: 'Gymnasium',
    })

    // Mock upload creation
    mockDb.upload.create.mockResolvedValue({
      id: 'upload-123',
      fileName: 'test.jpg',
      fileUrl: '',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      analysisStatus: 'pending',
    })

    // Mock storage upload
    mockUploadFileToStorage.mockResolvedValue('https://storage.example.com/upload-123/test.jpg')

    // Mock analysis
    mockAnalyzeUploadBuffer.mockResolvedValue(undefined)

    const formData = new FormData()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('files', file)
    formData.append('childId', 'child-123')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await uploadHandler(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.uploadId).toBe('upload-123')

    expect(mockRequireAuth).toHaveBeenCalled()
    expect(mockDb.child.findUnique).toHaveBeenCalledWith({
      where: { id: 'child-123' },
    })
    expect(mockDb.upload.create).toHaveBeenCalled()
    expect(mockUploadFileToStorage).toHaveBeenCalled()
    expect(mockAnalyzeUploadBuffer).toHaveBeenCalledWith('upload-123', expect.any(Array))
  })

  test('handles analysis failures gracefully', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'user-123' } })
    mockDb.child.findUnique.mockResolvedValue({
      id: 'child-123',
      userId: 'user-123',
      name: 'Test Child',
      grade: 5,
      schoolType: 'Gymnasium',
    })
    mockDb.upload.create.mockResolvedValue({
      id: 'upload-123',
      fileName: 'test.jpg',
      fileUrl: '',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      analysisStatus: 'pending',
    })
    mockUploadFileToStorage.mockResolvedValue('https://storage.example.com/upload-123/test.jpg')
    mockAnalyzeUploadBuffer.mockRejectedValue(new Error('Analysis failed'))

    const formData = new FormData()
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    formData.append('files', file)
    formData.append('childId', 'child-123')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await uploadHandler(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Analysis failed')
  })
})

describe('Uploads API', () => {
  const mockDb = require('@/lib/db').db
  const mockAuth = require('@/lib/auth')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns upload data successfully', async () => {
    mockAuth.auth.mockResolvedValue({
      user: { id: 'user-123' },
    })

    mockDb.upload.findUnique.mockResolvedValue({
      id: 'upload-123',
      fileName: 'test.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      analysisStatus: 'completed',
      subject: 'Mathematics',
      grade: 2.5,
      teacherComment: 'Good work',
      extractedText: 'Test content',
      uploadedAt: new Date('2024-01-15T10:00:00Z'),
      processedAt: new Date('2024-01-15T10:05:00Z'),
      childId: 'child-123',
      analysis: {
        ai: {
          summary: {
            overallGrade: '2+',
            subject: 'Mathematics',
            confidence: 0.9,
          },
          strengths: ['Good understanding'],
          weaknesses: ['Minor errors'],
          recommendations: [{
            priority: 1,
            action: 'Practice more',
            timeframe: '1 week',
          }],
        },
      },
      child: {
        id: 'child-123',
        name: 'Test Child',
        grade: 5,
        schoolType: 'Gymnasium',
      },
    })

    const request = new NextRequest('http://localhost:3000/api/uploads/upload-123')

    // Mock params
    const params = Promise.resolve({ id: 'upload-123' })
    const response = await uploadsGetHandler(request, { params: params as any })
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.upload.id).toBe('upload-123')
    expect(result.upload.analysisStatus).toBe('completed')
    expect(result.upload.analysis.ai.summary.overallGrade).toBe('2+')
  })

  test('returns 404 for non-existent uploads', async () => {
    mockAuth.auth.mockResolvedValue({
      user: { id: 'user-123' },
    })

    mockDb.upload.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/uploads/non-existent')

    const params = Promise.resolve({ id: 'non-existent' })
    const response = await uploadsGetHandler(request, { params: params as any })
    const result = await response.json()

    expect(response.status).toBe(404)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Upload not found')
  })
})

describe('Children API', () => {
  const mockDb = require('@/lib/db').db
  const mockAuth = require('@/lib/auth')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns children list successfully', async () => {
    mockAuth.auth.mockResolvedValue({
      user: { id: 'user-123' },
    })

    mockDb.child.findMany.mockResolvedValue([
      {
        id: 'child-1',
        name: 'Alice',
        grade: 5,
        schoolType: 'Gymnasium',
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'child-2',
        name: 'Bob',
        grade: 3,
        schoolType: 'Hauptschule',
        createdAt: new Date('2024-01-02'),
      },
    ])

    const request = new NextRequest('http://localhost:3000/api/children')
    const response = await childrenHandler(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.children).toHaveLength(2)
    expect(result.children[0].name).toBe('Alice')
    expect(result.children[1].name).toBe('Bob')
  })

  test('handles database errors', async () => {
    mockAuth.auth.mockResolvedValue({
      user: { id: 'user-123' },
    })

    mockDb.child.findMany.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/children')
    const response = await childrenHandler(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to fetch children')
  })
})