import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { uploadFileToStorage } from '@/lib/storage'

export const runtime = 'nodejs'
export const maxDuration = 300

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')
    const status = searchParams.get('status')

    const where: any = { userId: session.user.id }
    if (childId) where.childId = childId
    if (status && status !== 'all') where.status = status

    const documents = await db.schoolDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        child: {
          select: { id: true, name: true, grade: true, schoolType: true },
        },
      },
    })

    return NextResponse.json({ success: true, documents })
  } catch (error) {
    console.error('[SchoolComm API] GET error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const childId = formData.get('childId') as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }
    if (!childId) {
      return NextResponse.json({ success: false, error: 'Child ID is required' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPG, PNG, and PDF are supported.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File exceeds 4MB limit.' },
        { status: 400 }
      )
    }

    // Verify child belongs to user
    const child = await db.child.findUnique({ where: { id: childId } })
    if (!child || child.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Child not found' }, { status: 404 })
    }

    // Upload file to GCS
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storageFileName = `school-docs/${timestamp}-${sanitizedName}`

    const fileUrl = await uploadFileToStorage(storageFileName, buffer, file.type)
    console.log(`[SchoolComm API] File uploaded: ${fileUrl}`)

    // Create database record
    const document = await db.schoolDocument.create({
      data: {
        userId,
        childId,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        status: 'pending',
      },
    })

    // Return document ID + base64 image for AI extraction
    const base64 = buffer.toString('base64')

    return NextResponse.json({
      success: true,
      documentId: document.id,
      image: { base64, mimeType: file.type },
    })
  } catch (error) {
    console.error('[SchoolComm API] POST error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
