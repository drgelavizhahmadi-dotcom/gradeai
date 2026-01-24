/**
 * Manual Analysis Script
 *
 * Directly analyzes an upload by ID, bypassing HTTP requests.
 * Useful for debugging and testing the analysis pipeline.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { extractText, parseGermanTest } from '../lib/ocr'
import { convertGermanGrade } from '../lib/ocr/gradeConverter'
import { analyzeTest } from '../lib/ai/claude'

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create Prisma adapter
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Get upload ID from command line or use default
  const uploadId = process.argv[2] || 'cmk9z3p190000t0umbcalz5l3'

  console.log('='.repeat(60))
  console.log('MANUAL ANALYSIS SCRIPT')
  console.log('='.repeat(60))
  console.log(`Upload ID: ${uploadId}`)
  console.log('')

  try {
    // Step 1: Fetch upload from database
    console.log('[1/6] Fetching upload from database...')
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

    console.log('✓ Upload found:')
    console.log(`  - File: ${upload.fileName}`)
    console.log(`  - Size: ${(upload.fileSize / 1024).toFixed(2)} KB`)
    console.log(`  - Child: ${upload.child.name}`)
    console.log(`  - Status: ${upload.analysisStatus}`)
    console.log('')

    // Step 2: Update status to processing
    console.log('[2/6] Updating status to processing...')
    await prisma.upload.update({
      where: { id: uploadId },
      data: { analysisStatus: 'processing' },
    })
    console.log('✓ Status updated')
    console.log('')

    // Step 3: Read file and extract text
    console.log('[3/6] Reading file and extracting text...')
    const filePath = path.resolve(upload.fileUrl)

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    console.log(`  - File path: ${filePath}`)

    const fileBuffer = fs.readFileSync(filePath)
    console.log(`  - File loaded: ${(fileBuffer.length / 1024).toFixed(2)} KB`)

    const extractedText = await extractText(fileBuffer)
    console.log(`✓ Text extracted: ${extractedText.text.length} characters`)
    console.log(`  - Preview: ${extractedText.text.substring(0, 100)}...`)
    console.log('')

    // Step 4: Parse German test data
    console.log('[4/6] Parsing German test data...')
    const parsedData = parseGermanTest(extractedText.text)
    console.log('✓ Data parsed:')
    console.log(`  - Grade: ${parsedData.grade || 'Not found'}`)
    console.log(`  - Subject: ${parsedData.subject || 'Not found'}`)
    console.log(`  - Teacher comment: ${parsedData.teacherComment ? 'Found' : 'Not found'}`)

    const gradeFloat = convertGermanGrade(parsedData.grade)
    console.log(`  - Grade numeric: ${gradeFloat}`)
    console.log('')

    // Step 5: Analyze with Claude AI
    console.log('[5/6] Analyzing with Claude AI...')
    let aiAnalysis = null
    let aiError = null

    try {
      aiAnalysis = await analyzeTest({
        subject: parsedData.subject,
        grade: parsedData.grade,
        teacherComment: parsedData.teacherComment,
        extractedText: extractedText.text,
        childName: upload.child.name,
        studentGrade: upload.child.grade,
        schoolType: upload.child.schoolType,
      })

      console.log('✓ AI analysis completed:')
      console.log(`  - Subject: ${aiAnalysis.summary?.subject}`)
      console.log(`  - Grade: ${aiAnalysis.summary?.overallGrade}`)
      console.log(`  - Strengths: ${aiAnalysis.strengths?.length || 0}`)
      console.log(`  - Weaknesses: ${aiAnalysis.weaknesses?.length || 0}`)
      console.log(`  - Recommendations: ${aiAnalysis.recommendations?.length || 0}`)
      console.log(`  - Prediction: ${aiAnalysis.longTermDevelopment?.semesterPrediction || 'N/A'}`)
    } catch (error) {
      console.error('✗ AI analysis failed:', error)
      aiError = error instanceof Error ? error.message : 'AI analysis failed'
      console.log('  - Continuing without AI analysis...')
    }
    console.log('')

    // Step 6: Update database with results
    console.log('[6/6] Updating database with results...')

    const analysis = {
      parsedAt: new Date().toISOString(),
      confidence: 'medium',
      extractedData: {
        grade: parsedData.grade,
        gradeNumeric: gradeFloat,
        subject: parsedData.subject,
        teacherComment: parsedData.teacherComment,
      },
      ai: aiAnalysis,
      aiError: aiError,
    }

    const updatedUpload = await prisma.upload.update({
      where: { id: uploadId },
      data: {
        extractedText: extractedText.text,
        subject: parsedData.subject,
        grade: gradeFloat,
        teacherComment: parsedData.teacherComment,
        analysis: analysis as any,
        analysisStatus: 'completed',
        processedAt: new Date(),
      },
    })

    console.log('✓ Database updated')
    console.log(`  - Status: ${updatedUpload.analysisStatus}`)
    console.log(`  - Processed at: ${updatedUpload.processedAt?.toISOString()}`)
    console.log('')

    console.log('='.repeat(60))
    console.log('ANALYSIS COMPLETE!')
    console.log('='.repeat(60))
    console.log('')
    console.log('View results at:')
    console.log(`http://localhost:3000/uploads/${uploadId}`)
    console.log('')

  } catch (error) {
    console.error('')
    console.error('='.repeat(60))
    console.error('ERROR OCCURRED')
    console.error('='.repeat(60))
    console.error(error)

    // Try to update status to failed
    try {
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      console.error('')
      console.error('✓ Upload status set to failed')
    } catch (updateError) {
      console.error('✗ Failed to update upload status:', updateError)
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch(console.error)
