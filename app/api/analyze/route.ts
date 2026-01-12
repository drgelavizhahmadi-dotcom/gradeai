// Load environment variables first, before any other imports
import { config } from 'dotenv'
config({ path: '.env.local' })

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { extractText, parseGermanTest } from '@/lib/ocr'
import { convertGermanGrade } from '@/lib/ocr/gradeConverter'
import { analyzeTest } from '@/lib/ai/claude'
import { requireAuth } from '@/lib/auth'

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create Prisma adapter
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

interface AnalyzeRequestBody {
  uploadId: string
}

export async function POST(request: NextRequest) {
  console.log('='.repeat(80))
  console.log('=== ANALYZE API CALLED ===')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)
  console.log('Content-Type:', request.headers.get('content-type'))
  console.log('User-Agent:', request.headers.get('user-agent'))
  console.log('Origin:', request.headers.get('origin'))
  console.log('Referer:', request.headers.get('referer'))
  console.log('='.repeat(80))

  let uploadId: string | undefined

  try {
    // Check authentication
    console.log('=== CHECKING AUTHENTICATION ===')
    const session = await requireAuth()
    const authenticatedUserId = session.user.id
    console.log('Authentication successful! User ID:', authenticatedUserId)
    console.log('='.repeat(80))

    // Parse request body
    console.log('[Analyze API] Attempting to parse request body...')
    const body: AnalyzeRequestBody = await request.json()
    console.log('[Analyze API] Request body parsed successfully:', body)
    uploadId = body.uploadId

    if (!uploadId) {
      console.error('[Analyze API] Missing uploadId in request')
      return NextResponse.json(
        { success: false, error: 'uploadId is required' },
        { status: 400 }
      )
    }

    console.log(`[Analyze API] Processing upload: ${uploadId}`)

    // Fetch upload from database with relations
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        child: true,
        user: true,
      },
    })

    if (!upload) {
      console.error(`[Analyze API] Upload not found: ${uploadId}`)
      return NextResponse.json(
        { success: false, error: 'Upload not found' },
        { status: 404 }
      )
    }

    console.log(`[Analyze API] Found upload:`, {
      id: upload.id,
      fileName: upload.fileName,
      fileUrl: upload.fileUrl,
      childName: upload.child.name,
      userName: upload.user.name,
    })

    // Verify the upload belongs to the authenticated user
    if (upload.userId !== authenticatedUserId) {
      console.error(`[Analyze API] Unauthorized access attempt by user ${authenticatedUserId} to upload ${uploadId} owned by ${upload.userId}`)
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only analyze your own uploads' },
        { status: 403 }
      )
    }

    // Update status to processing
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        analysisStatus: 'processing',
      },
    })

    console.log('[Analyze API] Status updated to processing')

    // Read file from fileUrl
    const filePath = path.resolve(upload.fileUrl)

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`)
    }

    console.log(`[Analyze API] Reading file: ${filePath}`)
    const fileBuffer = fs.readFileSync(filePath)
    console.log(`[Analyze API] File loaded: ${(fileBuffer.length / 1024).toFixed(2)} KB`)

    // Extract text using OCR
    console.log('[Analyze API] Starting text extraction...')
    const extractedText = await extractText(fileBuffer)

    if (!extractedText) {
      console.warn('[Analyze API] No text extracted from image')
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: 'failed',
          errorMessage: 'No text could be extracted from the image',
          extractedText: '',
        },
      })

      return NextResponse.json({
        success: false,
        error: 'No text could be extracted from the image',
      })
    }

    console.log(`[Analyze API] Text extracted: ${extractedText.length} characters`)

    // Parse German test data
    console.log('[Analyze API] Parsing German test data...')
    const parsedData = parseGermanTest(extractedText)

    console.log('[Analyze API] Parsed data:', {
      grade: parsedData.grade,
      subject: parsedData.subject,
      hasComment: !!parsedData.teacherComment,
    })

    // Convert grade string to numeric value
    const gradeFloat = convertGermanGrade(parsedData.grade)
    console.log(`[Analyze API] Grade conversion: ${parsedData.grade} -> ${gradeFloat}`)

    // Analyze with Claude AI
    console.log('[Analyze API] Starting AI analysis with Claude...')
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

      console.log('[Analyze API] AI analysis completed successfully')
      console.log('[Analyze API] Grade severity:', aiAnalysis.gradeInterpretation.severity)
      console.log('[Analyze API] Concern level:', aiAnalysis.gradeInterpretation.concernLevel)
    } catch (error) {
      console.error('[Analyze API] AI analysis failed:', error)
      aiError = error instanceof Error ? error.message : 'AI analysis failed'

      // Don't fail the entire analysis if AI fails
      // We still have the OCR data which is valuable
      console.warn('[Analyze API] Continuing without AI analysis...')
    }

    // Prepare comprehensive analysis JSON
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

    console.log('[Analyze API] Complete analysis structure prepared')

    // Update database with extracted and parsed data
    console.log('[Analyze API] Updating database with results...')
    const updatedUpload = await prisma.upload.update({
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

    console.log('[Analyze API] Analysis completed successfully')

    return NextResponse.json(
      {
        success: true,
        uploadId: updatedUpload.id,
        data: {
          extractedText: extractedText,
          parsed: {
            grade: parsedData.grade,
            gradeNumeric: gradeFloat,
            subject: parsedData.subject,
            teacherComment: parsedData.teacherComment,
          },
          analysis: analysis,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('='.repeat(80))
    console.error('=== ANALYZE API ERROR ===')
    console.error('Error:', error)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Upload ID:', uploadId || 'NOT SET')
    console.error('='.repeat(80))

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      console.error('=== AUTHENTICATION FAILED ===')
      console.error('This is likely because the request came from server-to-server (no session cookies)')
      console.error('='.repeat(80))
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 },
      )
    }

    // Try to update the upload status to failed (using uploadId from outer scope)
    if (uploadId) {
      try {
        await prisma.upload.update({
          where: { id: uploadId },
          data: {
            analysisStatus: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        })
        console.log('[Analyze API] Upload status set to failed')
      } catch (updateError) {
        console.error('[Analyze API] Failed to update upload status:', updateError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } finally {
    await prisma.$disconnect()
  }
}
