import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { deleteFileFromStorage } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const document = await db.schoolDocument.findUnique({
      where: { id, userId: session.user.id },
      include: {
        child: { select: { id: true, name: true, grade: true, schoolType: true } },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error('[SchoolComm API] GET [id] error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existing = await db.schoolDocument.findUnique({
      where: { id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Build update data from allowed fields
    const updateData: any = {}
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'done') {
        updateData.markedDoneAt = new Date()
      }
    }
    if (body.title !== undefined) updateData.title = body.title
    if (body.category !== undefined) updateData.category = body.category

    const document = await db.schoolDocument.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error('[SchoolComm API] PUT error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const document = await db.schoolDocument.findUnique({
      where: { id, userId: session.user.id },
    })
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from GCS
    try {
      await deleteFileFromStorage(document.fileUrl)
    } catch (storageError) {
      console.error('[SchoolComm API] Failed to delete file from storage:', storageError)
    }

    // Delete database record
    await db.schoolDocument.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SchoolComm API] DELETE error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
