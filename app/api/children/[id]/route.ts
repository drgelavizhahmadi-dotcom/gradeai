import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← Changed to Promise
) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params
    const { id } = await params  // ← Added await

    const child = await db.child.findUnique({
      where: { 
        id: id,  // ← Use the awaited id
        userId: session.user.id 
      }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    return NextResponse.json({ child })
  } catch (error) {
    console.error('[Children API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch child' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← Changed to Promise
) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params
    const { id } = await params  // ← Added await
    const body = await request.json()
    const { name, grade, schoolType } = body

    const child = await db.child.update({
      where: { 
        id: id,  // ← Use the awaited id
        userId: session.user.id 
      },
      data: { name, grade, schoolType }
    })

    return NextResponse.json({ child })
  } catch (error) {
    console.error('[Children API] Error:', error)
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← Changed to Promise
) {
  try {
    const session = await requireAuth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await the params
    const { id } = await params  // ← Added await

    await db.child.delete({
      where: { 
        id: id,  // ← Use the awaited id
        userId: session.user.id 
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Children API] Error:', error)
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
  }
}