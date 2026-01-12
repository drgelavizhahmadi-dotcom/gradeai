import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Validation schema for creating a child
const createChildSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  grade: z.number().int().min(1, 'Grade must be at least 1').max(13, 'Grade must be at most 13'),
  schoolType: z.string().min(1, 'School type is required'),
})

// GET /api/children - List all children for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()
    const authenticatedUserId = session.user.id

    console.log(`[Children API] Fetching children for user: ${authenticatedUserId}`)

    // Fetch all children for the authenticated user
    const children = await db.child.findMany({
      where: { userId: authenticatedUserId },
      include: {
        _count: {
          select: { uploads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`[Children API] Found ${children.length} children`)

    return NextResponse.json({
      success: true,
      children,
    })
  } catch (error) {
    console.error('[Children API] Error fetching children:', error)

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
        error: error instanceof Error ? error.message : 'Failed to fetch children',
      },
      { status: 500 }
    )
  }
}

// POST /api/children - Create new child
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()
    const authenticatedUserId = session.user.id

    console.log(`[Children API] Creating child for user: ${authenticatedUserId}`)

    // Parse request body
    const body = await request.json()

    // Validate request body
    let validatedData
    try {
      validatedData = createChildSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: error.issues[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    // Create child
    const child = await db.child.create({
      data: {
        name: validatedData.name,
        grade: validatedData.grade,
        schoolType: validatedData.schoolType,
        userId: authenticatedUserId,
      },
    })

    console.log(`[Children API] Child created successfully: ${child.id}`)

    return NextResponse.json({
      success: true,
      child,
    })
  } catch (error) {
    console.error('[Children API] Error creating child:', error)

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'A child with this information already exists' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create child',
      },
      { status: 500 }
    )
  }
}
