import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { extractText, parseGermanTest } from '@/lib/ocr'
import { convertGermanGrade } from '@/lib/ocr/gradeConverter'

const prisma = new PrismaClient()

interface AnalyzeRequestBody {
  uploadId: string
}

export async function POST(request: NextRequest) {
  console.log('[Analyze API] Received analyze request')

  try {
    // Parse request body
    const body: AnalyzeRequestBody = await request.json()
    const { uploadId } = body

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

    // Prepare analysis JSON
    const analysis = {
      parsedAt: new Date().toISOString(),
      confidence: 'medium', // Could be enhanced with actual confidence scores
      extractedData: {
        grade: parsedData.grade,
        gradeNumeric: gradeFloat,
        subject: parsedData.subject,
        teacherComment: parsedData.teacherComment,
      },
    }

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

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('[Analyze API] Error during analysis:', error)

    // Try to update the upload status to failed
    try {
      const body: AnalyzeRequestBody = await request.json()
      if (body.uploadId) {
        await prisma.upload.update({
          where: { id: body.uploadId },
          data: {
            analysisStatus: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        })
        console.log('[Analyze API] Upload status set to failed')
      }
    } catch (updateError) {
      console.error('[Analyze API] Failed to update upload status:', updateError)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
