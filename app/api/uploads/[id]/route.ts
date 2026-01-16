import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const upload = await db.upload.findUnique({
      where: { 
        id: id,
        userId: session.user.id 
      },
      include: { child: true }
    })

    if (!upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
    }

    return NextResponse.json({ upload })
  } catch (error) {
    console.error('[Uploads API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch upload' }, { status: 500 })
  }
}