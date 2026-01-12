import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { requireAuth } from '@/lib/auth'

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create Prisma adapter
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication - TEMPORARILY DISABLED
    // const session = await requireAuth()
    // const authenticatedUserId = session.user.id
    // console.log(`[Uploads API] Authenticated user: ${authenticatedUserId}`)

    const { id } = await params

    console.log(`[Uploads API] Fetching upload: ${id}`)

    const upload = await prisma.upload.findUnique({
      where: { id },
      include: {
        child: {
          select: {
            name: true,
            grade: true,
            schoolType: true,
          },
        },
      },
    })

    if (!upload) {
      console.log(`[Uploads API] Upload not found: ${id}`)
      return NextResponse.json(
        { success: false, error: 'Upload not found' },
        { status: 404 }
      )
    }

    console.log(`[Uploads API] Upload found: ${upload.fileName}, status: ${upload.analysisStatus}`)
    console.log(`[Uploads API] Analysis field exists:`, !!upload.analysis)
    if (upload.analysis) {
      console.log(`[Uploads API] Analysis has AI data:`, !!(upload.analysis as any)?.ai)
    }

    // Verify the upload belongs to the authenticated user - TEMPORARILY DISABLED
    // if (upload.userId !== authenticatedUserId) {
    //   console.error(`[Uploads API] Unauthorized access attempt by user ${authenticatedUserId} to upload ${id} owned by ${upload.userId}`)
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized: You can only view your own uploads' },
    //     { status: 403 }
    //   )
    // }

    return NextResponse.json({
      success: true,
      upload: {
        id: upload.id,
        fileName: upload.fileName,
        fileSize: upload.fileSize,
        mimeType: upload.mimeType,
        analysisStatus: upload.analysisStatus,
        subject: upload.subject,
        grade: upload.grade,
        teacherComment: upload.teacherComment,
        extractedText: upload.extractedText,
        errorMessage: upload.errorMessage,
        uploadedAt: upload.uploadedAt.toISOString(),
        processedAt: upload.processedAt?.toISOString() || null,
        analysis: upload.analysis, // Add the analysis field from database
        child: upload.child,
      },
    })
  } catch (error) {
    console.error('[Uploads API] Error fetching upload:', error)

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch upload',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
