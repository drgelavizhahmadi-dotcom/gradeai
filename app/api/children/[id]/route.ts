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

    const child = await db.child.findUnique({
      where: { 
        id: id,
        userId: session.user.id 
      },
      include: {
        uploads: {
          orderBy: { uploadedAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            uploadedAt: true,
            analysisStatus: true,
            subject: true,
            grade: true,
            analysis: true,
          }
        }
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, child })
  } catch (error) {
    console.error('[Children API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch child' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, grade, schoolType } = body

    const child = await db.child.update({
      where: { 
        id: id,
        userId: session.user.id 
      },
      data: { name, grade, schoolType }
    })

    return NextResponse.json({ success: true, child })
  } catch (error) {
    console.error('[Children API] Error:', error)
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
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

    await db.child.delete({
      where: { 
        id: id,
        userId: session.user.id 
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Children API] Error:', error)
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
  }
}