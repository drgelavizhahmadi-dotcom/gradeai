/**
 * Standalone Analysis Module
 *
 * This module contains the core analysis logic that processes uploaded test files.
 * It handles OCR, parsing, AI analysis, and database updates.
 *
 * By making this a standalone function, we can call it directly from the upload route
 * without relying on HTTP requests, which eliminates auth issues and silent failures.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { extractText, parseGermanTest } from '@/lib/ocr'
import { convertGermanGrade } from '@/lib/ocr/gradeConverter'
import { analyzeTest } from '@/lib/ai/claude'

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create Prisma adapter
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

/**
 * Checks if extracted text contains school-related keywords
 * @param text - The extracted text to validate
 * @returns True if text appears to be from a school test
 */
function isLikelySchoolTest(text: string): boolean {
  const schoolKeywords = [
    'klassenarbeit', 'test', 'klasse', 'aufgabe', 'punkte',
    'note', 'datum', 'fach', 'schule', 'lehrer', 'lehrerin',
    'name:', 'klasse:', 'sehr gut', 'gut', 'befriedigend',
    'ausreichend', 'mangelhaft', 'ungenügend',
    'mathematik', 'deutsch', 'englisch', 'geschichte',
    'biologie', 'physik', 'chemie', 'erdkunde', 'geographie',
    'religion', 'ethik', 'kunst', 'musik', 'sport',
    'französisch', 'spanisch', 'latein', 'informatik',
    'sozialkunde', 'politik', 'bewertung', 'korrektur'
  ]

  const textLower = text.toLowerCase()
  const matchCount = schoolKeywords.filter(keyword =>
    textLower.includes(keyword)
  ).length

  // Must have at least 2 school-related keywords
  return matchCount >= 2
}

/**
 * Checks if text contains technical/non-educational content
 * @param text - The extracted text to check
 * @returns True if text appears to be technical content
 */
function containsTechnicalContent(text: string): boolean {
  const techKeywords = [
    'database', 'frontend', 'backend', 'api', 'authentication',
    'user_id', 'child_id', 'postgresql', 'react', 'typescript',
    'monolith', 'architecture', 'component', 'interface',
    'prisma', 'nextauth', 'vercel', 'deployment', 'migration',
    'function', 'const', 'import', 'export', 'class',
    'async', 'await', 'promise', 'callback', 'endpoint',
    'schema', 'model', 'relation', 'foreign key', 'primary key'
  ]

  const textLower = text.toLowerCase()

  // Check for multiple tech keywords (at least 3 to avoid false positives)
  const techMatchCount = techKeywords.filter(keyword =>
    textLower.includes(keyword)
  ).length

  return techMatchCount >= 3
}

/**
 * Analyzes an uploaded test file
 *
 * This function:
 * 1. Fetches the upload from database
 * 2. Reads the file from disk
 * 3. Extracts text using OCR (Google Vision)
 * 4. Validates that the image is actually a school test
 * 5. Parses German test data (grade, subject, comments)
 * 6. Runs AI analysis with Claude
 * 7. Updates database with results
 *
 * @param uploadId - The ID of the upload to analyze
 * @returns Promise that resolves when analysis is complete
 */
export async function analyzeUpload(uploadId: string): Promise<void> {
  console.log('='.repeat(80))
  console.log(`[Analysis] Starting analysis for upload: ${uploadId}`)
  console.log('='.repeat(80))

  try {
    // Step 1: Fetch upload from database with relations
    console.log('[Analysis] Step 1: Fetching upload from database...')
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        child: true,
        user: true,
      },
    })

    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`)
    }

    console.log('[Analysis] Upload found:', {
      id: upload.id,
      fileName: upload.fileName,
      fileUrl: upload.fileUrl,
      childName: upload.child.name,
      userName: upload.user.name,
    })

    // Step 2: Update status to processing
    console.log('[Analysis] Step 2: Updating status to processing...')
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        analysisStatus: 'processing',
      },
    })
    console.log('[Analysis] ✓ Status updated to processing')

    // Step 3: Read file from disk
    console.log('[Analysis] Step 3: Reading file from disk...')
    const filePath = path.resolve(upload.fileUrl)

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`)
    }

    const fileBuffer = fs.readFileSync(filePath)
    console.log(`[Analysis] ✓ File loaded: ${(fileBuffer.length / 1024).toFixed(2)} KB`)

    // Step 4: Extract text using OCR
    console.log('[Analysis] Step 4: Extracting text with OCR...')
    const extractedText = await extractText(fileBuffer)

    if (!extractedText || extractedText.trim().length === 0) {
      console.error('[Analysis] ✗ No text extracted from file')
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: 'failed',
          errorMessage: 'No text could be extracted from the image',
          extractedText: '',
        },
      })
      throw new Error('No text could be extracted from the image')
    }

    console.log(`[Analysis] ✓ Text extracted: ${extractedText.length} characters`)
    console.log(`[Analysis] Preview: ${extractedText.substring(0, 100)}...`)

    // Step 4.5: Validate that this is actually a school test
    console.log('[Analysis] Step 4.5: Validating school test content...')

    // First check: Is this technical/non-educational content?
    if (containsTechnicalContent(extractedText)) {
      console.error('[Analysis] ✗ Technical content detected - not a school test')

      const errorMessage = 'This appears to be a technical diagram or document, not a school test. ' +
        'Please upload a photo of your child\'s actual test paper with questions, answers, and grades.'

      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: 'failed',
          errorMessage: errorMessage,
          extractedText: extractedText,
        },
      })

      throw new Error(errorMessage)
    }

    // Second check: Does it look like a school test?
    const isSchoolTest = isLikelySchoolTest(extractedText)

    if (!isSchoolTest) {
      console.error('[Analysis] ✗ Image does not appear to be a school test')
      console.error('[Analysis] Text length:', extractedText.length)
      console.error('[Analysis] School test indicators found: false')

      const errorMessage = 'This doesn\'t appear to be a school test. ' +
        'Please upload a clear photo of your child\'s test that shows:\n' +
        '• Student name and class\n' +
        '• Test questions and answers\n' +
        '• Grade or teacher comments\n' +
        '• Subject name'

      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: 'failed',
          errorMessage: errorMessage,
          extractedText: extractedText,
        },
      })

      throw new Error(errorMessage)
    }

    // Warn if text is very short (might be partial image)
    if (extractedText.length < 50) {
      console.warn('[Analysis] ⚠ Warning: Text is very short, image might be partially cropped')
    }

    console.log('[Analysis] ✓ School test validation passed')
    console.log('[Analysis] School test indicators found: true')
    console.log('[Analysis] Text length:', extractedText.length)

    // Step 5: Parse German test data
    console.log('[Analysis] Step 5: Parsing German test data...')
    const parsedData = parseGermanTest(extractedText)

    console.log('[Analysis] ✓ Parsed data:', {
      grade: parsedData.grade,
      subject: parsedData.subject,
      hasComment: !!parsedData.teacherComment,
      commentLength: parsedData.teacherComment?.length || 0,
    })

    // Convert grade string to numeric value
    const gradeFloat = convertGermanGrade(parsedData.grade)
    console.log(`[Analysis] Grade conversion: ${parsedData.grade} -> ${gradeFloat}`)

    // Step 6: Analyze with Claude AI
    console.log('[Analysis] Step 6: Running AI analysis with Claude...')
    let aiAnalysis = null
    let aiError = null

    try {
      aiAnalysis = await analyzeTest({
        subject: parsedData.subject,
        grade: parsedData.grade,
        teacherComment: parsedData.teacherComment,
        extractedText: extractedText,
        childName: upload.child.name,
        studentGrade: upload.child.grade,
        schoolType: upload.child.schoolType,
      })

      console.log('[Analysis] ✓ AI analysis completed successfully')
      console.log('[Analysis] Grade severity:', aiAnalysis.gradeInterpretation.severity)
      console.log('[Analysis] Concern level:', aiAnalysis.gradeInterpretation.concernLevel)
      console.log('[Analysis] Strengths identified:', aiAnalysis.strengths.length)
      console.log('[Analysis] Weaknesses identified:', aiAnalysis.weaknesses.length)
    } catch (error) {
      console.error('[Analysis] ✗ AI analysis failed:', error)
      aiError = error instanceof Error ? error.message : 'AI analysis failed'

      // Don't fail the entire analysis if AI fails
      // We still have the OCR data which is valuable
      console.warn('[Analysis] ⚠ Continuing without AI analysis...')
    }

    // Step 7: Prepare comprehensive analysis JSON
    console.log('[Analysis] Step 7: Preparing analysis results...')
    const analysis = {
      parsedAt: new Date().toISOString(),
      confidence: 'medium',
      extractedData: {
        grade: parsedData.grade,
        gradeNumeric: gradeFloat,
        subject: parsedData.subject,
        teacherComment: parsedData.teacherComment,
      },
      ai: aiAnalysis, // Include AI analysis if successful, null otherwise
      aiError: aiError, // Include error message if AI failed
    }

    // Step 8: Update database with final results
    console.log('[Analysis] Step 8: Updating database with results...')
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        extractedText: extractedText,
        subject: parsedData.subject,
        grade: gradeFloat,
        teacherComment: parsedData.teacherComment,
        analysis: analysis as any,
        analysisStatus: 'completed',
        processedAt: new Date(),
      },
    })

    console.log('='.repeat(80))
    console.log(`[Analysis] ✓✓✓ Analysis completed successfully for upload: ${uploadId}`)
    console.log('='.repeat(80))
  } catch (error) {
    console.error('='.repeat(80))
    console.error(`[Analysis] ✗✗✗ Analysis failed for upload: ${uploadId}`)
    console.error('[Analysis] Error:', error)
    console.error('[Analysis] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Analysis] Error message:', error instanceof Error ? error.message : String(error))
    console.error('='.repeat(80))

    // Update database with failed status
    try {
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Analysis failed: Unknown error',
        },
      })
      console.log('[Analysis] Database updated with failed status')
    } catch (updateError) {
      console.error('[Analysis] Failed to update database with error status:', updateError)
    }

    // Re-throw the error so caller knows it failed
    throw error
  } finally {
    // Disconnect from database
    await prisma.$disconnect()
  }
}
