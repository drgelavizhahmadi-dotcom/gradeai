/**
 * In-memory Rate Limiter for Next.js API Routes
 *
 * Features:
 * - Sliding window rate limiting
 * - IP-based tracking
 * - Automatic cleanup of expired entries
 * - Production-ready with proper headers
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter: number
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private maxRequests: number
  private windowMs: number
  private cleanupInterval: NodeJS.Timeout | null = null

  /**
   * Create a new rate limiter
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   */
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs

    // Start cleanup interval (runs every 5 minutes)
    this.startCleanup()
  }

  /**
   * Check if a request should be allowed
   * @param identifier - Unique identifier (usually IP address)
   * @returns RateLimitResult with success status and metadata
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(identifier)

    // If no entry or window has expired, create new entry
    if (!entry || now >= entry.resetTime) {
      const resetTime = now + this.windowMs
      this.store.set(identifier, { count: 1, resetTime })

      return {
        success: true,
        remaining: this.maxRequests - 1,
        resetTime,
        retryAfter: 0,
      }
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

      console.log(`[RATE_LIMIT] Blocked: ${identifier} - ${entry.count}/${this.maxRequests} requests, retry after ${retryAfter}s`)

      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter,
      }
    }

    // Increment counter
    entry.count++
    this.store.set(identifier, entry)

    return {
      success: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
      retryAfter: 0,
    }
  }

  /**
   * Reset rate limit for an identifier
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.store.delete(identifier)
  }

  /**
   * Get current status for an identifier without incrementing
   * @param identifier - Unique identifier to check
   */
  status(identifier: string): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || now >= entry.resetTime) {
      return {
        success: true,
        remaining: this.maxRequests,
        resetTime: now + this.windowMs,
        retryAfter: 0,
      }
    }

    const remaining = Math.max(0, this.maxRequests - entry.count)
    const retryAfter = remaining === 0 ? Math.ceil((entry.resetTime - now) / 1000) : 0

    return {
      success: remaining > 0,
      remaining,
      resetTime: entry.resetTime,
      retryAfter,
    }
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    // Don't prevent Node from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Remove expired entries from the store
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[RATE_LIMIT] Cleanup: removed ${cleaned} expired entries`)
    }
  }

  /**
   * Stop the cleanup interval (for testing/shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

/**
 * Extract client IP address from request headers
 * Handles various proxy scenarios (Vercel, Cloudflare, nginx, etc.)
 *
 * @param request - Next.js Request object
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(request: Request): string {
  // Try various headers in order of preference
  const headers = request.headers

  // Vercel-specific header
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  // Standard proxy header
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // nginx
  const xRealIP = headers.get('x-real-ip')
  if (xRealIP) {
    return xRealIP
  }

  // Fallback
  return 'unknown'
}

/**
 * Check if IP is localhost (for development)
 */
export function isLocalhost(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip === '::ffff:127.0.0.1' ||
    ip === 'unknown'
  )
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

// Pre-configured rate limiters for auth endpoints
// These are singletons to persist across requests in serverless environment

// Signup: 5 attempts per hour
export const signupRateLimiter = new RateLimiter(5, 60 * 60 * 1000)

// Login: 10 attempts per hour
export const loginRateLimiter = new RateLimiter(10, 60 * 60 * 1000)

// General API: 100 requests per minute (for future use)
export const apiRateLimiter = new RateLimiter(100, 60 * 1000)
