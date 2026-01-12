import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Validation schema for updating a child
const updateChildSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  grade: z.number().int().min(1, 'Grade must be at least 1').max(13, 'Grade must be at most 13').optional(),
  schoolType: z.string().min(1, 'School type is required').optional(),
})

// GET /api/children/[id] - Get child details with uploads
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    const authenticatedUserId = session.user.id

    const { id } = await params

    console.log(`[Children API] Fetching child: ${id}`)

    // Fetch child with uploads
    const child = await db.child.findUnique({
      where: { id },
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
          },
        },
      },
    })

    if (!child) {
      console.log(`[Children API] Child not found: ${id}`)
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      )
    }

    // Verify the child belongs to the authenticated user
    if (child.userId !== authenticatedUserId) {
      console.error(`[Children API] Unauthorized access attempt by user ${authenticatedUserId} to child ${id} owned by ${child.userId}`)
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only view your own children' },
        { status: 403 }
      )
    }

    console.log(`[Children API] Child found: ${child.name}`)

    return NextResponse.json({
      success: true,
      child,
    })
  } catch (error) {
    console.error('[Children API] Error fetching child:', error)

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
        error: error instanceof Error ? error.message : 'Failed to fetch child',
      },
      { status: 500 }
    )
  }
}

// PUT /api/children/[id] - Update child information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    const authenticatedUserId = session.user.id

    const { id } = await params

    console.log(`[Children API] Updating child: ${id}`)

    // Check if child exists and belongs to user
    const existingChild = await db.child.findUnique({
      where: { id },
    })

    if (!existingChild) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      )
    }

    // Verify the child belongs to the authenticated user
    if (existingChild.userId !== authenticatedUserId) {
      console.error(`[Children API] Unauthorized update attempt by user ${authenticatedUserId} to child ${id}`)
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only update your own children' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request body
    let validatedData
    try {
      validatedData = updateChildSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: error.issues[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    // Update child
    const child = await db.child.update({
      where: { id },
      data: validatedData,
    })

    console.log(`[Children API] Child updated successfully: ${child.id}`)

    return NextResponse.json({
      success: true,
      child,
    })
  } catch (error) {
    console.error('[Children API] Error updating child:', error)

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
        error: error instanceof Error ? error.message : 'Failed to update child',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/children/[id] - Delete child and cascade uploads
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth()
    const authenticatedUserId = session.user.id

    const { id } = await params

    console.log(`[Children API] Deleting child: ${id}`)

    // Check if child exists and belongs to user
    const existingChild = await db.child.findUnique({
      where: { id },
      include: {
        _count: {
          select: { uploads: true },
        },
      },
    })

    if (!existingChild) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      )
    }

    // Verify the child belongs to the authenticated user
    if (existingChild.userId !== authenticatedUserId) {
      console.error(`[Children API] Unauthorized delete attempt by user ${authenticatedUserId} to child ${id}`)
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only delete your own children' },
        { status: 403 }
      )
    }

    console.log(`[Children API] Deleting child with ${existingChild._count.uploads} uploads`)

    // Delete child (uploads will be cascade deleted if configured in schema)
    await db.child.delete({
      where: { id },
    })

    console.log(`[Children API] Child deleted successfully: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Child and all associated uploads deleted successfully',
    })
  } catch (error) {
    console.error('[Children API] Error deleting child:', error)

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
        error: error instanceof Error ? error.message : 'Failed to delete child',
      },
      { status: 500 }
    )
  }
}
