import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    console.log('[Uploads API] Fetching upload with ID:', id)
    console.log('[Uploads API] Session user ID:', session.user.id)

    const upload = await db.upload.findUnique({
      where: { 
        id: id,
        userId: session.user.id 
      },
      include: { child: true }
    })

    if (!upload) {
      console.warn('[Uploads API] Upload not found for ID:', id)
      return NextResponse.json({ success: false, error: 'Upload not found' }, { status: 404 })
    }

    console.log('[Uploads API] Upload found:', upload)
    return NextResponse.json({ success: true, upload })
  } catch (error) {
    console.error('[Uploads API] Error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch upload' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership before deleting
    const upload = await db.upload.findUnique({
      where: { 
        id: id,
        userId: session.user.id 
      }
    })

    if (!upload) {
      return NextResponse.json({ success: false, error: 'Upload not found or access denied' }, { status: 404 })
    }

    // Delete the upload
    await db.upload.delete({
      where: { id: id }
    })

    console.log(`[Uploads API] Upload ${id} deleted successfully`)
    return NextResponse.json({ success: true, message: 'Upload deleted successfully' })
  } catch (error) {
    console.error('[Uploads API] Delete error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete upload' }, { status: 500 })
  }
}