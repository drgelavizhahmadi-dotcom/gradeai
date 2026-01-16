import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uploads = await db.upload.findMany({
      where: { userId: session.user.id },
      include: { child: true },
      orderBy: { uploadedAt: 'desc' },
      take: 50 // Limit to recent uploads
    })

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('[Uploads API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
  }
}