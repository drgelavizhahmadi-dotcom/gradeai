import { db } from '@/lib/db'

/**
 * Background job to recover abandoned uploads stuck in processing
 * Runs periodically to find uploads that have been in intermediate states too long
 * and mark them as failed with timeout error
 */

interface TimeoutConfig {
  extractingTimeout: number // milliseconds
  analyzingTimeout: number // milliseconds
  uploadingTimeout: number // milliseconds
}

const DEFAULT_CONFIG: TimeoutConfig = {
  extractingTimeout: 30 * 60 * 1000, // 30 minutes
  analyzingTimeout: 30 * 60 * 1000, // 30 minutes
  uploadingTimeout: 10 * 60 * 1000, // 10 minutes
}

/**
 * Check for abandoned uploads and mark as failed
 * Should be called periodically (e.g., every 5 minutes)
 */
export async function recoverAbandonedUploads(config = DEFAULT_CONFIG): Promise<{
  recovered: number
  errors: Array<{ uploadId: string; error: string }>
}> {
  const now = new Date()
  const recovered: string[] = []
  const errors: Array<{ uploadId: string; error: string }> = []

  try {
    // Find uploads in intermediate states that are too old
    const abandonedUploads = await db.upload.findMany({
      where: {
        OR: [
          {
            analysisStatus: 'uploading',
            uploadedAt: {
              lt: new Date(now.getTime() - config.uploadingTimeout),
            },
          },
          {
            analysisStatus: 'extracting',
            uploadedAt: {
              lt: new Date(now.getTime() - config.extractingTimeout),
            },
          },
          {
            analysisStatus: 'analyzing',
            uploadedAt: {
              lt: new Date(now.getTime() - config.analyzingTimeout),
            },
          },
        ],
      },
      select: { id: true, analysisStatus: true, uploadedAt: true },
    })

    console.log(`[Timeout Recovery] Found ${abandonedUploads.length} abandoned uploads`)

    // Mark each as failed
    for (const upload of abandonedUploads) {
      try {
        const timeSinceStart = now.getTime() - upload.uploadedAt.getTime()
        const timeoutMinutes = Math.round(timeSinceStart / 1000 / 60)

        await db.upload.update({
          where: { id: upload.id },
          data: {
            analysisStatus: 'failed',
            errorMessage: `Processing timeout after ${timeoutMinutes} minutes (status: ${upload.analysisStatus})`,
          },
        })

        recovered.push(upload.id)
        console.log(`[Timeout Recovery] Recovered upload ${upload.id} from ${upload.analysisStatus} state`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ uploadId: upload.id, error: errorMsg })
        console.error(`[Timeout Recovery] Failed to recover ${upload.id}:`, errorMsg)
      }
    }

    return { recovered: recovered.length, errors }
  } catch (error) {
    console.error('[Timeout Recovery] Fatal error:', error)
    throw error
  }
}

/**
 * Check for orphaned storage files (uploads marked as failed but files still exist)
 * Should be called periodically to clean up storage
 * Note: Requires implementation of listStorageFiles() utility
 */
export async function findOrphanedFiles(): Promise<string[]> {
  try {
    // Find failed uploads
    const failedUploads = await db.upload.findMany({
      where: { analysisStatus: 'failed' },
      select: { id: true, fileUrl: true },
    })

    console.log(`[Orphan Detection] Checking ${failedUploads.length} failed uploads for orphaned files`)

    // Return file URLs that should be cleaned up
    return failedUploads
      .filter((upload) => upload.fileUrl)
      .map((upload) => upload.fileUrl as string)
  } catch (error) {
    console.error('[Orphan Detection] Error:', error)
    return []
  }
}

/**
 * Health check for background jobs
 * Returns status of upload processing system
 */
export async function getProcessingHealthStatus() {
  try {
    const stats = {
      pending: await db.upload.count({ where: { analysisStatus: 'pending' } }),
      uploading: await db.upload.count({ where: { analysisStatus: 'uploading' } }),
      extracting: await db.upload.count({ where: { analysisStatus: 'extracting' } }),
      analyzing: await db.upload.count({ where: { analysisStatus: 'analyzing' } }),
      completed: await db.upload.count({ where: { analysisStatus: 'completed' } }),
      failed: await db.upload.count({ where: { analysisStatus: 'failed' } }),
    }

    const total = Object.values(stats).reduce((a, b) => a + b, 0)
    const processing = stats.uploading + stats.extracting + stats.analyzing
    const processingRatio = total > 0 ? processing / total : 0

    return {
      stats,
      total,
      processing,
      processingRatio,
      healthy: processingRatio < 0.1, // Less than 10% stuck in processing
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Health Check] Error:', error)
    return null
  }
}
