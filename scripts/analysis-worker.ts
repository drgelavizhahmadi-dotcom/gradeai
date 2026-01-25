#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client'
import { Storage } from '@google-cloud/storage'
import { analyzeUploadBuffer } from '@/lib/analysis'
import { db } from '@/lib/db'

const prisma = new PrismaClient()

async function listAndDownloadBuffers(storage: Storage, bucketName: string, uploadId: string) {
  const bucket = storage.bucket(bucketName)
  const [files] = await bucket.getFiles({ prefix: `uploads/${uploadId}/` })
  // Sort files by name to preserve page order
  files.sort((a, b) => (a.name > b.name ? 1 : -1))

  const buffers: Buffer[] = []
  for (const file of files) {
    const [buf] = await file.download()
    buffers.push(Buffer.from(buf))
  }
  return buffers
}

async function processOne(uploadId: string) {
  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET
  if (!bucketName) throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET not set')

  const storage = new Storage()

  try {
    // mark processing
    await prisma.upload.update({ where: { id: uploadId }, data: { analysisStatus: 'processing' } })

    const buffers = await listAndDownloadBuffers(storage, bucketName, uploadId)
    await analyzeUploadBuffer(uploadId, buffers)
    // analyzed function writes completed status
  } catch (err) {
    console.error('[Worker] Analysis failed for', uploadId, err)
    try {
      await prisma.upload.update({ where: { id: uploadId }, data: { analysisStatus: 'failed', errorMessage: err instanceof Error ? err.message : String(err) } })
    } catch (e) {
      console.error('[Worker] Failed to update DB for failed job', e)
    }
  }
}

async function workerLoop() {
  console.log('[Worker] Starting analysis worker loop')
  while (true) {
    try {
      // find one queued job
      const job = await prisma.upload.findFirst({ where: { analysisStatus: 'queued' }, orderBy: { uploadedAt: 'asc' } })
      if (job) {
        console.log('[Worker] Found queued upload:', job.id)
        await processOne(job.id)
      } else {
        // sleep 5s
        await new Promise((res) => setTimeout(res, 5000))
      }
    } catch (err) {
      console.error('[Worker] Loop error', err)
      await new Promise((res) => setTimeout(res, 5000))
    }
  }
}

workerLoop().catch((err) => {
  console.error('Worker crashed', err)
  process.exit(1)
})
