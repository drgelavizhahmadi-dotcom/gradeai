import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import {
  signupRateLimiter,
  getClientIP,
  isLocalhost,
  rateLimitResponse,
} from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request)

    // Skip rate limiting for localhost in development
    if (!isLocalhost(clientIP) || process.env.NODE_ENV === 'production') {
      const rateLimitResult = signupRateLimiter.check(clientIP)

      if (!rateLimitResult.success) {
        console.log(`[Signup API] Rate limit exceeded for IP: ${clientIP}`)
        return rateLimitResponse(rateLimitResult.retryAfter)
      }
    }

    const body = await request.json()
    const { name, email, password, phone, language } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hashPassword(password)

    // Create the user using db instead of prisma
    const user = await db.user.create({
      data: {
        name,
        email,
        hashedPassword,
        phone: phone || null,
        language: language || 'de',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        language: true,
        createdAt: true,
      },
    })

    console.log(`[Signup API] New user created: ${user.email}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Signup API] Error creating user:', error)
    return NextResponse.json(
      { error: 'An error occurred while creating your account' },
      { status: 500 }
    )
  }
}