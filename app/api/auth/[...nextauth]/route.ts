import { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  loginRateLimiter,
  getClientIP,
  isLocalhost,
  rateLimitResponse,
} from '@/lib/rate-limit'

const handler = NextAuth(authOptions)

/**
 * Wrapped POST handler with rate limiting for login attempts
 */
async function rateLimitedPOST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const clientIP = getClientIP(request)

  // Only rate limit in production or for non-localhost IPs
  if (!isLocalhost(clientIP) || process.env.NODE_ENV === 'production') {
    // Clone the request to read the body without consuming it
    const clonedRequest = request.clone()

    try {
      // Check if this is a credentials login attempt
      const formData = await clonedRequest.formData().catch(() => null)
      const isLoginAttempt = formData?.get('username') || formData?.get('email')

      if (isLoginAttempt) {
        const rateLimitResult = loginRateLimiter.check(clientIP)

        if (!rateLimitResult.success) {
          console.log(`[NextAuth] Rate limit exceeded for login from IP: ${clientIP}`)
          return rateLimitResponse(rateLimitResult.retryAfter)
        }
      }
    } catch {
      // If we can't parse the body, proceed without rate limiting
      // This handles cases like OAuth callbacks
    }
  }

  // Proceed with NextAuth handler
  return handler(request as unknown as Request, context)
}

/**
 * GET handler - no rate limiting needed (for OAuth callbacks, session checks)
 */
async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handler(request as unknown as Request, context)
}

export { GET, rateLimitedPOST as POST }
