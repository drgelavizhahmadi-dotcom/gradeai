import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Execute a multi-step operation in a database transaction
 * Ensures atomicity - either all steps succeed or all roll back
 * 
 * @param operation - Async function that performs the transaction
 * @returns Result from the operation
 * 
 * @example
 * const result = await withTransaction(async (tx) => {
 *   const upload = await tx.upload.findUnique({ where: { id } })
 *   if (upload.status !== 'pending') throw new Error('Invalid status')
 *   
 *   return await tx.upload.update({
 *     where: { id },
 *     data: { status: 'processing' }
 *   })
 * })
 */
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      return await operation(tx)
    })
  } catch (error) {
    console.error('[Transaction] Error:', error)
    throw error
  }
}

/**
 * Safely transition upload status with idempotency check
 * Prevents concurrent updates and status race conditions
 * 
 * @param uploadId - Upload ID
 * @param fromStatus - Expected current status
 * @param toStatus - New status
 * @param updates - Additional fields to update
 * @returns Updated upload record
 * @throws Error if upload is not in expected status
 */
export async function transitionUploadStatus(
  uploadId: string,
  fromStatus: string,
  toStatus: string,
  updates: Record<string, any> = {}
) {
  return withTransaction(async (tx) => {
    // Verify current status before updating
    const upload = await tx.upload.findUnique({
      where: { id: uploadId },
      select: { analysisStatus: true, id: true },
    })

    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`)
    }

    if (upload.analysisStatus !== fromStatus) {
      throw new Error(
        `Invalid status transition: expected ${fromStatus}, got ${upload.analysisStatus}`
      )
    }

    // Perform atomic update
    return await tx.upload.update({
      where: { id: uploadId },
      data: {
        analysisStatus: toStatus,
        ...updates,
      },
    })
  })
}

/**
 * Safely update upload with error handling and idempotency
 * If update fails, ensures error status is saved to DB
 * 
 * @param uploadId - Upload ID
 * @param data - Data to update
 * @param errorOnFail - Whether to mark as failed if update fails
 * @returns Updated upload record
 */
export async function safeUpdateUpload(
  uploadId: string,
  data: Record<string, any>,
  errorOnFail = false
) {
  try {
    return await withTransaction(async (tx) => {
      return await tx.upload.update({
        where: { id: uploadId },
        data,
      })
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    if (errorOnFail) {
      try {
        await prisma.upload.update({
          where: { id: uploadId },
          data: {
            analysisStatus: 'failed',
            errorMessage,
          },
        })
      } catch (dbError) {
        console.error('[Transaction] Failed to save error status:', dbError)
      }
    }

    throw error
  }
}

export { prisma }
