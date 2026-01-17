import { Storage } from '@google-cloud/storage'

let storageClient: Storage | null = null

export function getStorageClient(): Storage {
  if (!storageClient) {
    // Handle both file path (local) and JSON string (Vercel) credentials
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON

    let credentials
    if (credentialsJson) {
      // Vercel: Use JSON string from environment variable
      credentials = JSON.parse(credentialsJson)
    } else if (credentialsPath) {
      // Local: Use file path
      const fs = require('fs')
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf8')
      credentials = JSON.parse(credentialsContent)
    } else {
      throw new Error('Google Cloud credentials not configured')
    }

    // Ensure private_key has proper newlines (fix \n literals)
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')
    }

    storageClient = new Storage({
      projectId: credentials.project_id,
      credentials,
    })
  }

  return storageClient
}

export async function uploadFileToStorage(
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET
  if (!bucketName) {
    throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET environment variable not set')
  }

  const storage = getStorageClient()
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(filename)

  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
    },
  })

  // Return the GCS URI (not public URL since bucket is private)
  return `gs://${bucketName}/${filename}`
}

export async function downloadFileFromStorage(fileUrl: string): Promise<Buffer> {
  // Extract bucket and filename from gs:// URI
  const match = fileUrl.match(/^gs:\/\/([^\/]+)\/(.+)$/)
  if (!match) {
    throw new Error(`Invalid GCS URI: ${fileUrl}`)
  }

  const [, bucketName, filename] = match

  const storage = getStorageClient()
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(filename)

  const [buffer] = await file.download()
  return buffer
}

export async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  const match = fileUrl.match(/^gs:\/\/([^\/]+)\/(.+)$/)
  if (!match) {
    throw new Error(`Invalid GCS URI: ${fileUrl}`)
  }

  const [, bucketName, filename] = match

  const storage = getStorageClient()
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(filename)

  await file.delete()
}