import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const children = await db.child.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        uploads: {
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true,
            uploadedAt: true,
            fileName: true,
            grade: true,
            analysisStatus: true
          }
        }
      }
    })

    return NextResponse.json({ children })
  } catch (error) {
    console.error('[Children API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, grade, schoolType } = body

    if (!name || !grade || !schoolType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const child = await db.child.create({
      data: {
        name,
        grade,
        schoolType,
        userId: session.user.id
      }
    })

    return NextResponse.json({ child }, { status: 201 })
  } catch (error) {
    console.error('[Children API] Error:', error)
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
  }
}