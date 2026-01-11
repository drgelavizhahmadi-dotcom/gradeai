import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

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
        child: upload.child,
      },
    })
  } catch (error) {
    console.error('[Uploads API] Error fetching upload:', error)

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
