import sharp from 'sharp'

/**
 * Separate red ink (teacher notes) from blue/black ink (student work)
 */
export async function separateRedInk(imageBuffer: Buffer): Promise<{
  redChannel: Buffer
  blueBlackChannel: Buffer
  original: Buffer
}> {
  console.log('[ColorSep] Starting red ink separation...')

  const image = sharp(imageBuffer)
  const metadata = await image.metadata()
  
  console.log(`[ColorSep] Image size: ${metadata.width}x${metadata.height}`)

  // Get raw pixel data
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Create separate channels
  const redPixels = Buffer.alloc(data.length)
  const blueBlackPixels = Buffer.alloc(data.length)

  // Process pixels with improved red detection
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = info.channels === 4 ? data[i + 3] : 255

    // Improved red ink detection algorithm
    // Red pens have high R, low G and B, with significant difference
    const redness = r - Math.max(g, b)
    const isRed = (
      r > 130 &&           // Red channel must be strong
      g < 120 &&           // Green must be low
      b < 120 &&           // Blue must be low
      redness > 40 &&      // Significant red dominance
      (r / Math.max(g, b, 1)) > 1.3  // Ratio check for true red
    )

    // Also detect pink/light red (faded teacher marks)
    const isPinkish = (
      r > 180 && 
      g < 150 && 
      b < 150 && 
      redness > 30
    )

    if (isRed || isPinkish) {
      // Keep red pixels in red channel
      redPixels[i] = r
      redPixels[i + 1] = g
      redPixels[i + 2] = b
      if (info.channels === 4) redPixels[i + 3] = a

      // White out in blue/black channel
      blueBlackPixels[i] = 255
      blueBlackPixels[i + 1] = 255
      blueBlackPixels[i + 2] = 255
      if (info.channels === 4) blueBlackPixels[i + 3] = 255
    } else {
      // Keep in blue/black channel
      blueBlackPixels[i] = r
      blueBlackPixels[i + 1] = g
      blueBlackPixels[i + 2] = b
      if (info.channels === 4) blueBlackPixels[i + 3] = a

      // White out in red channel
      redPixels[i] = 255
      redPixels[i + 1] = 255
      redPixels[i + 2] = 255
      if (info.channels === 4) redPixels[i + 3] = 255
    }
  }

  // Convert back to images
  const redChannel = await sharp(redPixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels as 3 | 4,
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer()

  const blueBlackChannel = await sharp(blueBlackPixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels as 3 | 4,
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer()

  console.log('[ColorSep] ✓ Separation complete')
  console.log(`[ColorSep] Red channel: ${(redChannel.length / 1024).toFixed(1)}KB`)
  console.log(`[ColorSep] Blue/Black channel: ${(blueBlackChannel.length / 1024).toFixed(1)}KB`)

  return {
    redChannel,
    blueBlackChannel,
    original: imageBuffer,
  }
}

/**
 * Enhance image for better OCR/Vision AI processing
 * Optimized for handwritten German school tests
 */
export async function enhanceImage(imageBuffer: Buffer): Promise<Buffer> {
  console.log('[ImageEnhance] Enhancing image for handwriting recognition...')

  const enhanced = await sharp(imageBuffer)
    // Resize to good resolution (not too high to avoid over-processing)
    .resize(2400, 2400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    // Normalize to improve contrast
    .normalize()
    // Gentle sharpen to make text clearer
    .sharpen({
      sigma: 1.0,
    })
    // High quality JPEG output
    .jpeg({ 
      quality: 95,
      chromaSubsampling: '4:4:4'
    })
    .toBuffer()

  console.log(`[ImageEnhance] ✓ Enhanced: ${(imageBuffer.length / 1024).toFixed(1)}KB → ${(enhanced.length / 1024).toFixed(1)}KB`)

  return enhanced
}
