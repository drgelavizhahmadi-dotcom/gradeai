/**
 * Image Preprocessing Pipeline for OCR
 *
 * Enhances camera photos and scanned documents before sending to Google Vision API.
 * Optimized for German school tests with handwritten content and teacher corrections.
 */

import sharp from 'sharp'

export interface PreprocessingResult {
  processedBuffer: Buffer
  originalSize: { width: number; height: number }
  processedSize: { width: number; height: number }
  rotationApplied: number
  processingTimeMs: number
  stepsApplied: string[]
}

export interface PreprocessingOptions {
  enableAutoRotate?: boolean          // default: true - fix EXIF orientation
  enableResize?: boolean              // default: true - scale to optimal size
  enableGrayscale?: boolean           // default: true - convert to grayscale
  enableContrastEnhancement?: boolean // default: true - improve contrast
  enableNoiseReduction?: boolean      // default: true - reduce noise
  enableSharpening?: boolean          // default: true - sharpen text edges
  enableBinarization?: boolean        // default: false - keep grayscale for Vision API
  targetMinWidth?: number             // default: 1500 - minimum width for OCR
  targetMaxWidth?: number             // default: 3000 - maximum width to save processing
  jpegQuality?: number                // default: 95 - output quality
}

export interface ColorSeparationResult {
  studentWriting: Buffer   // Black/blue text (student's work)
  teacherMarks: Buffer     // Red corrections (teacher's marks)
  combined: Buffer         // Enhanced combined image
  hasRedMarks: boolean     // Whether red marks were detected
}

const DEFAULT_OPTIONS: Required<PreprocessingOptions> = {
  enableAutoRotate: true,
  enableResize: true,
  enableGrayscale: true,
  enableContrastEnhancement: true,
  enableNoiseReduction: true,
  enableSharpening: true,
  enableBinarization: false,
  targetMinWidth: 1500,
  targetMaxWidth: 3000,
  jpegQuality: 95,
}

/**
 * Main preprocessing function for images before OCR
 * Applies a series of enhancements to improve text recognition accuracy
 */
export async function preprocessImage(
  imageBuffer: Buffer,
  options?: PreprocessingOptions
): Promise<PreprocessingResult> {
  const startTime = Date.now()
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const stepsApplied: string[] = []

  console.log('[Preprocessing] Starting image enhancement pipeline...')
  console.log(`[Preprocessing] Input buffer size: ${(imageBuffer.length / 1024).toFixed(2)} KB`)

  try {
    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    console.log(`[Preprocessing] Original size: ${originalWidth}x${originalHeight}`)
    console.log(`[Preprocessing] Format: ${metadata.format}, Orientation: ${metadata.orientation || 'none'}`)

    // Start with the image pipeline
    let pipeline = sharp(imageBuffer)

    // Step 1: Auto-rotate based on EXIF orientation
    if (opts.enableAutoRotate) {
      pipeline = pipeline.rotate() // Auto-rotate based on EXIF
      stepsApplied.push('auto-rotate')
      console.log('[Preprocessing] Step 1: Auto-rotate applied (EXIF)')
    }

    // Step 2: Resize to optimal dimensions
    if (opts.enableResize) {
      const resizeResult = await applyResize(pipeline, originalWidth, originalHeight, opts)
      pipeline = resizeResult.pipeline
      if (resizeResult.applied) {
        stepsApplied.push(`resize-${resizeResult.newWidth}x${resizeResult.newHeight}`)
        console.log(`[Preprocessing] Step 2: Resized to ${resizeResult.newWidth}x${resizeResult.newHeight}`)
      }
    }

    // Step 3: Convert to grayscale
    if (opts.enableGrayscale) {
      pipeline = pipeline.grayscale()
      stepsApplied.push('grayscale')
      console.log('[Preprocessing] Step 3: Converted to grayscale')
    }

    // Step 4: Contrast enhancement
    if (opts.enableContrastEnhancement) {
      pipeline = pipeline
        .normalize() // Stretch histogram for better contrast
        .linear(1.15, -15) // Slight contrast boost: multiply by 1.15, subtract 15
      stepsApplied.push('contrast-enhance')
      console.log('[Preprocessing] Step 4: Contrast enhanced (normalize + linear)')
    }

    // Step 5: Noise reduction
    if (opts.enableNoiseReduction) {
      pipeline = pipeline.median(3) // 3x3 median filter removes salt-and-pepper noise
      stepsApplied.push('noise-reduction')
      console.log('[Preprocessing] Step 5: Noise reduction (median filter)')
    }

    // Step 6: Sharpening for text edges
    if (opts.enableSharpening) {
      pipeline = pipeline.sharpen({
        sigma: 1.2,   // Gaussian sigma for sharpening mask
        m1: 1.0,      // Sharpening level for flat areas
        m2: 2.0,      // Sharpening level for jagged areas (text edges)
      })
      stepsApplied.push('sharpen')
      console.log('[Preprocessing] Step 6: Sharpened text edges')
    }

    // Step 7: Optional binarization (threshold)
    if (opts.enableBinarization) {
      pipeline = pipeline.threshold(128) // Convert to pure black/white
      stepsApplied.push('binarize')
      console.log('[Preprocessing] Step 7: Binarization applied (threshold)')
    }

    // Output as high-quality PNG or JPEG
    const processedBuffer = await pipeline
      .png({ compressionLevel: 6 }) // PNG for lossless quality
      .toBuffer()

    // Get processed dimensions
    const processedMetadata = await sharp(processedBuffer).metadata()
    const processedWidth = processedMetadata.width || originalWidth
    const processedHeight = processedMetadata.height || originalHeight

    const processingTimeMs = Date.now() - startTime

    console.log(`[Preprocessing] Output size: ${processedWidth}x${processedHeight}`)
    console.log(`[Preprocessing] Output buffer: ${(processedBuffer.length / 1024).toFixed(2)} KB`)
    console.log(`[Preprocessing] Complete in ${processingTimeMs}ms`)
    console.log(`[Preprocessing] Steps applied: ${stepsApplied.join(', ')}`)

    return {
      processedBuffer,
      originalSize: { width: originalWidth, height: originalHeight },
      processedSize: { width: processedWidth, height: processedHeight },
      rotationApplied: 0, // EXIF-based, actual degrees unknown
      processingTimeMs,
      stepsApplied,
    }
  } catch (error) {
    console.error('[Preprocessing] Error during preprocessing:', error)
    console.log('[Preprocessing] Falling back to original image')

    // Return original image if preprocessing fails
    const metadata = await sharp(imageBuffer).metadata()
    return {
      processedBuffer: imageBuffer,
      originalSize: { width: metadata.width || 0, height: metadata.height || 0 },
      processedSize: { width: metadata.width || 0, height: metadata.height || 0 },
      rotationApplied: 0,
      processingTimeMs: Date.now() - startTime,
      stepsApplied: ['fallback-original'],
    }
  }
}

/**
 * Apply smart resize based on image dimensions
 */
async function applyResize(
  pipeline: sharp.Sharp,
  width: number,
  height: number,
  opts: Required<PreprocessingOptions>
): Promise<{ pipeline: sharp.Sharp; applied: boolean; newWidth: number; newHeight: number }> {
  let newWidth = width
  let newHeight = height
  let applied = false

  if (width < opts.targetMinWidth) {
    // Scale up small images
    const scale = opts.targetMinWidth / width
    newWidth = opts.targetMinWidth
    newHeight = Math.round(height * scale)
    applied = true
  } else if (width > opts.targetMaxWidth) {
    // Scale down very large images
    const scale = opts.targetMaxWidth / width
    newWidth = opts.targetMaxWidth
    newHeight = Math.round(height * scale)
    applied = true
  }

  if (applied) {
    pipeline = pipeline.resize(newWidth, newHeight, {
      kernel: 'lanczos3', // High-quality resampling
      fit: 'fill',
    })
  }

  return { pipeline, applied, newWidth, newHeight }
}

/**
 * Separate colors for teacher marks (red) vs student writing (black/blue)
 * Useful for analyzing teacher corrections separately
 */
export async function separateColors(imageBuffer: Buffer): Promise<ColorSeparationResult> {
  console.log('[Color Separation] Analyzing image for teacher marks...')
  const startTime = Date.now()

  try {
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    // Get raw pixel data
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixels = info.width * info.height
    const channels = info.channels

    let redPixelCount = 0
    const redThreshold = 0.6 // Red channel should be 60% stronger than others

    // Analyze color distribution
    for (let i = 0; i < pixels; i++) {
      const offset = i * channels
      const r = data[offset]
      const g = data[offset + 1]
      const b = data[offset + 2]

      // Detect red ink (high red, low green/blue)
      if (r > 150 && r > g * 1.5 && r > b * 1.5) {
        redPixelCount++
      }
    }

    const redPercentage = (redPixelCount / pixels) * 100
    const hasRedMarks = redPercentage > 0.5 // More than 0.5% red pixels

    console.log(`[Color Separation] Red pixels: ${redPercentage.toFixed(2)}%`)
    console.log(`[Color Separation] Has red marks: ${hasRedMarks}`)

    // Extract teacher marks (red channel emphasis)
    const teacherMarks = await sharp(imageBuffer)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(async ({ data: rawData, info: rawInfo }) => {
        // Create mask for red pixels
        const mask = Buffer.alloc(rawInfo.width * rawInfo.height)
        for (let i = 0; i < rawInfo.width * rawInfo.height; i++) {
          const offset = i * rawInfo.channels
          const r = rawData[offset]
          const g = rawData[offset + 1]
          const b = rawData[offset + 2]

          // Red detection: high red, low green and blue
          if (r > 120 && r > g * 1.3 && r > b * 1.3) {
            mask[i] = 0 // Black (mark present)
          } else {
            mask[i] = 255 // White (no mark)
          }
        }

        return sharp(mask, {
          raw: { width: rawInfo.width, height: rawInfo.height, channels: 1 }
        })
          .png()
          .toBuffer()
      })

    // Extract student writing (grayscale, remove red)
    const studentWriting = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen({ sigma: 1.0 })
      .png()
      .toBuffer()

    // Create enhanced combined image
    const combined = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .linear(1.2, -10)
      .sharpen({ sigma: 1.2 })
      .png()
      .toBuffer()

    console.log(`[Color Separation] Complete in ${Date.now() - startTime}ms`)

    return {
      studentWriting,
      teacherMarks,
      combined,
      hasRedMarks,
    }
  } catch (error) {
    console.error('[Color Separation] Error:', error)

    // Fallback: return grayscale version for all
    const grayscale = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .png()
      .toBuffer()

    return {
      studentWriting: grayscale,
      teacherMarks: grayscale,
      combined: grayscale,
      hasRedMarks: false,
    }
  }
}

/**
 * Preprocess specifically for handwritten text
 * Uses settings optimized for pencil/pen on paper
 */
export async function preprocessHandwritten(imageBuffer: Buffer): Promise<PreprocessingResult> {
  return preprocessImage(imageBuffer, {
    enableAutoRotate: true,
    enableResize: true,
    enableGrayscale: true,
    enableContrastEnhancement: true,
    enableNoiseReduction: true,
    enableSharpening: true,
    enableBinarization: false, // Keep grayscale for better handwriting recognition
    targetMinWidth: 1800,      // Slightly larger for handwriting detail
    targetMaxWidth: 3500,
  })
}

/**
 * Preprocess for printed text (typed documents)
 */
export async function preprocessPrinted(imageBuffer: Buffer): Promise<PreprocessingResult> {
  return preprocessImage(imageBuffer, {
    enableAutoRotate: true,
    enableResize: true,
    enableGrayscale: true,
    enableContrastEnhancement: true,
    enableNoiseReduction: false, // Printed text doesn't need denoising
    enableSharpening: true,
    enableBinarization: true,   // Binarization works well for printed text
    targetMinWidth: 1200,
    targetMaxWidth: 2500,
  })
}

/**
 * Quick preprocess for already-decent quality images
 * Minimal processing to save time
 */
export async function preprocessQuick(imageBuffer: Buffer): Promise<PreprocessingResult> {
  return preprocessImage(imageBuffer, {
    enableAutoRotate: true,
    enableResize: true,
    enableGrayscale: true,
    enableContrastEnhancement: false,
    enableNoiseReduction: false,
    enableSharpening: false,
    enableBinarization: false,
    targetMinWidth: 1200,
    targetMaxWidth: 2500,
  })
}

/**
 * Detect if image likely needs heavy preprocessing
 * Based on brightness, contrast, and blur detection
 */
export async function analyzeImageQuality(imageBuffer: Buffer): Promise<{
  needsPreprocessing: boolean
  brightness: number      // 0-255, ideal ~128
  contrast: number        // 0-100, higher is better
  isBlurry: boolean
  recommendedMode: 'quick' | 'standard' | 'handwritten'
}> {
  try {
    const stats = await sharp(imageBuffer).stats()

    // Calculate average brightness from all channels
    const avgBrightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length

    // Calculate contrast from standard deviation
    const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length
    const contrast = Math.min(100, (avgStdDev / 128) * 100)

    // Determine if preprocessing is needed
    const isTooLight = avgBrightness > 200
    const isTooDark = avgBrightness < 50
    const isLowContrast = contrast < 30

    // Simple blur detection: low contrast images tend to be blurry
    const isBlurry = contrast < 20

    const needsPreprocessing = isTooLight || isTooDark || isLowContrast || isBlurry

    // Recommend processing mode
    let recommendedMode: 'quick' | 'standard' | 'handwritten' = 'standard'
    if (!needsPreprocessing) {
      recommendedMode = 'quick'
    } else if (isLowContrast || isBlurry) {
      recommendedMode = 'handwritten' // More aggressive enhancement
    }

    console.log(`[Quality Analysis] Brightness: ${avgBrightness.toFixed(1)}, Contrast: ${contrast.toFixed(1)}%`)
    console.log(`[Quality Analysis] Needs preprocessing: ${needsPreprocessing}, Mode: ${recommendedMode}`)

    return {
      needsPreprocessing,
      brightness: avgBrightness,
      contrast,
      isBlurry,
      recommendedMode,
    }
  } catch (error) {
    console.error('[Quality Analysis] Error:', error)
    return {
      needsPreprocessing: true,
      brightness: 128,
      contrast: 50,
      isBlurry: false,
      recommendedMode: 'standard',
    }
  }
}
