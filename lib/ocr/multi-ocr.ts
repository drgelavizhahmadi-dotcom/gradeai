/**
 * Multi-OCR Strategy with Cascading Fallback
 *
 * Strategy:
 * 1. Google Cloud Vision (Primary) - Best quality, using free credits
 * 2. If Google fails or confidence < 85%, fallback to Tesseract OCR
 * 3. Return best result based on confidence + text length
 *
 * UPDATED: Tesseract fallback is now ENABLED
 */

import { createWorker, Worker } from 'tesseract.js'
import { extractTextFromImage } from './vision'

export interface OcrResult {
  text: string
  confidence: number
  provider: string
  processingTime: number
}

export interface MultiOcrResult {
  text: string
  confidence: number
  primaryProvider: string
  fallbackUsed: boolean
  allResults: OcrResult[]
}

const CONFIDENCE_THRESHOLD = 85
const TESSERACT_TIMEOUT_MS = 20000 // tighten to 20s for faster failure

/**
 * Run Tesseract OCR on image buffer with timeout handling
 * Languages: German (deu) + English (eng) for best results on German school tests
 */
async function runTesseractOcr(imageBuffer: Buffer): Promise<OcrResult> {
  const startTime = Date.now()
  let worker: Worker | null = null

  console.log('[Tesseract] Starting OCR...')
  console.log('[Tesseract] Image size:', (imageBuffer.length / 1024).toFixed(2), 'KB')

  try {
    // Create worker with timeout wrapper
    const workerPromise = createWorker(['deu', 'eng'], 1, {
      logger: (m) => {
        // Only log progress updates, not every message
        if (m.status === 'recognizing text' && m.progress) {
          const percent = (m.progress * 100).toFixed(0)
          if (Number(percent) % 25 === 0) {
            console.log(`[Tesseract] Progress: ${percent}%`)
          }
        }
      },
    })

    // Race between worker creation and timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Tesseract worker creation timeout')), TESSERACT_TIMEOUT_MS)
    })

    worker = await Promise.race([workerPromise, timeoutPromise])

    // Recognize text with timeout
    const recognizePromise = worker.recognize(imageBuffer)
    const recognizeTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Tesseract recognition timeout')), TESSERACT_TIMEOUT_MS)
    })

    const { data } = await Promise.race([recognizePromise, recognizeTimeout])
    const processingTime = Date.now() - startTime

    console.log(`[Tesseract] ✓ Complete in ${processingTime}ms`)
    console.log(`[Tesseract] Confidence: ${data.confidence.toFixed(1)}%`)
    console.log(`[Tesseract] Text length: ${data.text.length} chars`)

    return {
      text: data.text,
      confidence: data.confidence,
      provider: 'Tesseract',
      processingTime,
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`[Tesseract] ✗ Failed after ${processingTime}ms:`, error instanceof Error ? error.message : String(error))
    throw error
  } finally {
    // Always clean up worker to prevent memory leaks
    // Add timeout to termination itself to prevent hanging
    if (worker) {
      try {
        const terminatePromise = worker.terminate()
        const terminateTimeout = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('[Tesseract] Worker termination timeout - forcing cleanup')
            resolve()
          }, 5000) // 5 second timeout for termination
        })
        await Promise.race([terminatePromise, terminateTimeout])
        console.log('[Tesseract] Worker terminated (memory cleanup)')
      } catch (terminateError) {
        console.warn('[Tesseract] Worker termination warning:', terminateError)
      }
    }
  }
}

/**
 * Select best OCR result based on confidence and text quality
 */
function selectBestResult(results: OcrResult[]): OcrResult {
  if (results.length === 0) {
    throw new Error('No OCR results to select from')
  }

  if (results.length === 1) {
    return results[0]
  }

  console.log('[Multi-OCR] Comparing results:')
  results.forEach((r) => {
    console.log(`  - ${r.provider}: ${r.confidence.toFixed(1)}% confidence, ${r.text.length} chars, ${r.processingTime}ms`)
  })

  // Sort by confidence descending
  const sorted = [...results].sort((a, b) => b.confidence - a.confidence)

  // If top result has high confidence, use it
  if (sorted[0].confidence >= 90) {
    console.log(`[Multi-OCR] Selected ${sorted[0].provider} (high confidence: ${sorted[0].confidence.toFixed(1)}%)`)
    return sorted[0]
  }

  // If confidence is similar, prefer longer text (more detail extracted)
  const topTwo = sorted.slice(0, 2)
  if (topTwo.length === 2 && Math.abs(topTwo[0].confidence - topTwo[1].confidence) < 10) {
    const longer = topTwo[0].text.length > topTwo[1].text.length ? topTwo[0] : topTwo[1]
    console.log(`[Multi-OCR] Selected ${longer.provider} (similar confidence, longer text)`)
    return longer
  }

  console.log(`[Multi-OCR] Selected ${sorted[0].provider} (highest confidence)`)
  return sorted[0]
}

/**
 * Main multi-OCR function with cascading fallback
 *
 * Flow:
 * 1. Try Google Cloud Vision (primary, best quality)
 * 2. If Google succeeds with high confidence (>=85%), return immediately
 * 3. If Google fails OR confidence is low, try Tesseract as fallback
 * 4. Select best result from all successful attempts
 * 5. If all fail, throw descriptive error
 */
export async function extractTextMultiOcr(imageBuffer: Buffer): Promise<MultiOcrResult> {
  console.log('================================================================================')
  console.log('[Multi-OCR] Starting cascading OCR analysis')
  console.log('[Multi-OCR] Image size:', (imageBuffer.length / 1024).toFixed(2), 'KB')
  console.log('================================================================================')

  const allResults: OcrResult[] = []
  let fallbackUsed = false
  let googleFailed = false

  // Step 1: Try Google Cloud Vision first (primary)
  try {
    const startTime = Date.now()
    console.log('[Multi-OCR] Step 1: Running Google Cloud Vision (Primary)...')

    const googleResult = await extractTextFromImage(imageBuffer)
    const processingTime = Date.now() - startTime

    const result: OcrResult = {
      text: googleResult.text,
      confidence: googleResult.confidence * 100, // Convert 0-1 to 0-100
      provider: 'Google Cloud Vision',
      processingTime,
    }

    allResults.push(result)

    console.log(`[Multi-OCR] Google Vision: ${result.confidence.toFixed(1)}% confidence, ${result.text.length} chars, ${processingTime}ms`)

    // If Google confidence is good enough, return immediately (skip Tesseract)
    if (result.confidence >= CONFIDENCE_THRESHOLD && result.text.length > 0) {
      console.log('[Multi-OCR] ✓ Google Vision confidence acceptable, skipping fallbacks')
      console.log('================================================================================')

      return {
        text: result.text,
        confidence: result.confidence,
        primaryProvider: result.provider,
        fallbackUsed: false,
        allResults,
      }
    }

    // Google succeeded but confidence is low - will try Tesseract too
    if (result.confidence < CONFIDENCE_THRESHOLD) {
      console.log(`[Multi-OCR] ⚠ Google Vision confidence below ${CONFIDENCE_THRESHOLD}%, will try Tesseract fallback`)
    }
    if (result.text.length === 0) {
      console.log('[Multi-OCR] ⚠ Google Vision returned empty text, will try Tesseract fallback')
    }
  } catch (error) {
    console.error('[Multi-OCR] ✗ Google Vision failed:', error instanceof Error ? error.message : String(error))
    googleFailed = true
  }

  const fastMode = process.env.ANALYSIS_FAST === '1' || process.env.ANALYSIS_FAST === 'true'

  // Step 2: Try Tesseract OCR as fallback unless fast mode
  if (!fastMode) {
    try {
      console.log('[Multi-OCR] Step 2: Running Tesseract OCR (Fallback)...')
      const tesseractResult = await runTesseractOcr(imageBuffer)
      allResults.push(tesseractResult)
      fallbackUsed = true
      console.log(`[Multi-OCR] Tesseract: ${tesseractResult.confidence.toFixed(1)}% confidence, ${tesseractResult.text.length} chars`)
    } catch (tesseractError) {
      console.error('[Multi-OCR] ✗ Tesseract failed:', tesseractError instanceof Error ? tesseractError.message : String(tesseractError))

      // If Google also failed, we have no results
      if (googleFailed) {
        throw new Error(
          `All OCR providers failed. Google Vision: ${googleFailed ? 'failed' : 'low confidence'}. Tesseract: ${tesseractError instanceof Error ? tesseractError.message : 'unknown error'}`
        )
      }
      // Otherwise, we still have Google results (even if low confidence)
    }
  } else {
    console.log('[Multi-OCR] Fast mode enabled: skipping Tesseract fallback')
  }

  // Step 3: Select best result from all successful attempts
  if (allResults.length === 0) {
    throw new Error('All OCR providers failed - no text could be extracted from the image')
  }

  const bestResult = selectBestResult(allResults)

  console.log('================================================================================')
  console.log(`[Multi-OCR] ✓ Final result from ${bestResult.provider}`)
  console.log(`[Multi-OCR] Confidence: ${bestResult.confidence.toFixed(1)}%`)
  console.log(`[Multi-OCR] Text length: ${bestResult.text.length} characters`)
  console.log(`[Multi-OCR] Processing time: ${bestResult.processingTime}ms`)
  console.log(`[Multi-OCR] Fallback used: ${fallbackUsed ? 'Yes' : 'No'}`)
  console.log(`[Multi-OCR] Total providers tried: ${allResults.length}`)
  console.log('================================================================================')

  return {
    text: bestResult.text,
    confidence: bestResult.confidence,
    primaryProvider: bestResult.provider,
    fallbackUsed,
    allResults,
  }
}

/**
 * Simplified extraction function that returns just text and confidence
 * This matches the signature expected by lib/analysis.ts
 */
export async function extractTextWithFallback(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  const result = await extractTextMultiOcr(imageBuffer)
  return {
    text: result.text,
    confidence: result.confidence / 100, // Convert back to 0-1 scale
  }
}
