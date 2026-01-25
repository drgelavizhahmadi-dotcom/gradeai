import { Storage } from '@google-cloud/storage'

let storageClient: Storage | null = null

export function getStorageClient(): Storage {
  if (!storageClient) {
    // Handle both file path (local) and JSON string (Vercel) credentials
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    const credentialsB64 = process.env.GOOGLE_CREDENTIALS_B64 || process.env.GOOGLE_APPLICATION_CREDENTIALS_B64

    let credentials
    try {
      if (credentialsJson) {
        // Vercel: Try to parse JSON string from environment variable
        try {
          credentials = JSON.parse(credentialsJson)
          console.info('[storage] using credentials from GOOGLE_CREDENTIALS_JSON env')
        } catch (e) {
          // If parsing fails, try treating it as base64
          try {
            const decoded = Buffer.from(credentialsJson, 'base64').toString('utf8')
            credentials = JSON.parse(decoded)
            console.info('[storage] using credentials from GOOGLE_CREDENTIALS_JSON env (detected base64, decoded)')
          } catch (err) {
            throw err
          }
        }
      } else if (credentialsB64) {
        // Accept dedicated B64 env var
        const decoded = Buffer.from(credentialsB64, 'base64').toString('utf8')
        credentials = JSON.parse(decoded)
        console.info('[storage] using credentials from GOOGLE_CREDENTIALS_B64 env (decoded)')
      } else if (credentialsPath) {
        // Local: Use file path
        const fs = require('fs')
        const credentialsContent = fs.readFileSync(credentialsPath, 'utf8')
        credentials = JSON.parse(credentialsContent)
        console.info('[storage] using credentials from file:', credentialsPath)
      } else {
        throw new Error('Google Cloud credentials not configured')
      }
    } catch (err) {
      console.error('[storage] failed to parse Google credentials:', ((err as any)?.message) || err)
      throw err
    }

    // Ensure private_key has proper newlines (fix \n literals)
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      // Detect whether private_key contains escaped newlines or real newlines
      const hasEscapedNewlines = /\\n/.test(credentials.private_key)
      const hasRealNewlines = /\n/.test(credentials.private_key)
      console.info('[storage] private_key length:', credentials.private_key.length, 'escapedNewlines:', hasEscapedNewlines, 'realNewlines:', hasRealNewlines)
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')
    }

    try {
      // Log minimal masked info for diagnostics (do NOT log the private key)
      console.info('[storage] credential client_email:', credentials.client_email)
      const pk = credentials.private_key || ''
      console.info('[storage] private_key preview:', pk.slice(0, 30).replace(/\n/g, '\\n'), '...len=' + pk.length, 'endsWithEND:', pk.trim().endsWith('-----END PRIVATE KEY-----'))
      storageClient = new Storage({
        projectId: credentials.project_id,
        credentials,
      })
    } catch (err) {
      console.error('[storage] failed to create Storage client:', ((err as any)?.message) || err)
      throw err
    }
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