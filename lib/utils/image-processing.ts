import sharp from 'sharp';

/**
 * Detects if an image is likely blurry using Laplacian variance.
 * @param buffer The image buffer.
 * @returns Object indicating if blurry and the calculated score.
 */
export async function detectBlurryImage(buffer: Buffer): Promise<{ isBlurry: boolean; score: number }> {
  try {
    // 1. Convert to grayscale and resize for faster processing
    // 2. Apply Laplacian convolution to find edges
    // 3. Get statistics to find variance
    const { data, info } = await sharp(buffer)
      .greyscale()
      .resize(500, 500, { fit: 'inside' })
      .convolve({
        width: 3,
        height: 3,
        kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] // Laplacian kernel
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calculate variance (standard deviation squared)
    // Sharp's stats can give us the standard deviation
    const stats = await sharp(data, { raw: info }).stats();
    const stdDev = stats.channels[0].stdev;
    const variance = stdDev * stdDev;

    // Threshold for blurriness. 
    // Typical "sharp" images have variance > 100-500.
    // Very blurry images usually have variance < 50.
    // Experimentation might be needed to tune this "blurred" threshold.
    const BLUR_THRESHOLD = 40; 

    return {
      isBlurry: variance < BLUR_THRESHOLD,
      score: variance
    };
  } catch (error) {
    console.error('[ImageProcessing] Blur detection failed:', error);
    return { isBlurry: false, score: -1 }; // Fail safe: assume not blurry if check fails
  }
}

/**
 * Checks if an image is likely blank or has very little content.
 */
export async function isBlankImage(buffer: Buffer): Promise<boolean> {
  try {
    const stats = await sharp(buffer).stats();
    const mean = stats.channels.reduce((acc, c) => acc + c.mean, 0) / stats.channels.length;
    const stdDev = stats.channels.reduce((acc, c) => acc + c.stdev, 0) / stats.channels.length;

    // If mean is very high (>250) it's likely white/blank
    // If mean is very low (<5) it's likely black/blank
    // If stdDev is very low (<1) it's likely a solid color
    return mean > 251 || mean < 4 || stdDev < 1.5;
  } catch (error) {
    return false;
  }
}
