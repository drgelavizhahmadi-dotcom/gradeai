import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

/**
 * Idempotency key management for API requests
 * Prevents duplicate processing if a request is retried
 * 
 * Stores the result of an operation keyed by idempotency key
 * If same key is received again, returns cached result instead of re-executing
 */

interface IdempotencyRecord {
  id: string
  key: string
  result: any
  status: 'pending' | 'success' | 'failed'
  error?: string
  createdAt: Date
  expiresAt: Date
}

const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Extract idempotency key from request headers
 * Standard header: Idempotency-Key
 */
export function getIdempotencyKey(request: NextRequest): string | null {
  return request.headers.get('Idempotency-Key')
}

/**
 * Check if operation with this idempotency key has been processed
 * Returns cached result if it exists
 */
export async function getIdempotencyResult(
  key: string
): Promise<{ exists: boolean; result?: any; status?: string; error?: string }> {
  try {
    // In a production system, this would query a dedicated idempotency table
    // For now, we'll use a simple in-memory store with TTL
    // In production, use Redis or a database table with TTL index
    
    const stored = idempotencyStore.get(key)
    
    if (!stored) {
      return { exists: false }
    }
    
    // Check if expired
    if (stored.expiresAt < new Date()) {
      idempotencyStore.delete(key)
      return { exists: false }
    }
    
    return {
      exists: true,
      result: stored.result,
      status: stored.status,
      error: stored.error,
    }
  } catch (error) {
    console.error('[Idempotency] Error checking result:', error)
    return { exists: false }
  }
}

/**
 * Store operation result for idempotency
 */
export async function storeIdempotencyResult(
  key: string,
  result: any,
  status: 'success' | 'failed' = 'success',
  error?: string
): Promise<void> {
  try {
    const record: IdempotencyRecord = {
      id: `${key}-${Date.now()}`,
      key,
      result,
      status,
      error,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL),
    }
    
    idempotencyStore.set(key, record)
    
    console.log(`[Idempotency] Stored result for key: ${key} (status: ${status})`)
  } catch (error) {
    console.error('[Idempotency] Error storing result:', error)
    // Don't throw - idempotency is nice-to-have, not critical
  }
}

/**
 * Clear expired idempotency keys
 * Should be called periodically (e.g., every 6 hours)
 */
export function cleanupExpiredIdempotencyKeys(): number {
  const now = new Date()
  let cleaned = 0
  
  for (const [key, record] of idempotencyStore.entries()) {
    if (record.expiresAt < now) {
      idempotencyStore.delete(key)
      cleaned++
    }
  }
  
  console.log(`[Idempotency] Cleaned up ${cleaned} expired keys`)
  return cleaned
}

/**
 * In-memory store for idempotency keys
 * In production, replace with Redis or database
 */
const idempotencyStore = new Map<string, IdempotencyRecord>()

/**
 * Setup periodic cleanup of expired idempotency keys
 */
export function startIdempotencyCleanup(intervalMs = 6 * 60 * 60 * 1000) {
  setInterval(() => {
    cleanupExpiredIdempotencyKeys()
  }, intervalMs)
  
  console.log('[Idempotency] Cleanup task started')
}

/**
 * Middleware to handle idempotency for API endpoints
 * Usage in route handlers:
 * 
 * export async function POST(request: NextRequest) {
 *   const idempotencyKey = getIdempotencyKey(request)
 *   
 *   if (idempotencyKey) {
 *     const cached = await getIdempotencyResult(idempotencyKey)
 *     if (cached.exists) {
 *       return NextResponse.json(cached.result, { status: cached.status === 'failed' ? 500 : 200 })
 *     }
 *   }
 *   
 *   try {
 *     const result = await performOperation()
 *     
 *     if (idempotencyKey) {
 *       await storeIdempotencyResult(idempotencyKey, result, 'success')
 *     }
 *     
 *     return NextResponse.json(result)
 *   } catch (error) {
 *     if (idempotencyKey) {
 *       await storeIdempotencyResult(
 *         idempotencyKey,
 *         { error: error.message },
 *         'failed',
 *         error.message
 *       )
 *     }
 *     throw error
 *   }
 * }
 */

export type { IdempotencyRecord }
