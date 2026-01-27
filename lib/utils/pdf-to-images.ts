// @ts-ignore - sharp default export works at runtime
import sharp from 'sharp';
import { PageImage } from '../ai/vision/types';

const MAX_IMAGE_SIZE_KB = 1500; // Keep under 1.5MB for API limits
const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 2200;

export async function convertPdfToImages(pdfBuffer: Buffer): Promise<PageImage[]> {
  console.log('[PDF Converter] ========================================');
  console.log('[PDF Converter] Starting PDF conversion');
  console.log('[PDF Converter] PDF size:', (pdfBuffer.length / 1024).toFixed(0), 'KB');

  try {
    // Dynamic import for pdf2pic (ES module)
    const { fromBuffer } = await import('pdf2pic');

    // Options for conversion
    const options = {
      density: 200, // DPI - higher = better quality but larger file
      format: 'png' as const,
      width: MAX_IMAGE_WIDTH,
      height: MAX_IMAGE_HEIGHT,
      preserveAspectRatio: true,
    };

    const converter = fromBuffer(pdfBuffer, options);

    // Get page count using pdf2pic's bulk conversion
    // First try to get info about the PDF
    const images: PageImage[] = [];
    let pageNumber = 1;
    let hasMorePages = true;

    // Convert pages one by one until we hit an error (end of document)
    while (hasMorePages && pageNumber <= 20) { // Limit to 20 pages max
      try {
        console.log(`[PDF Converter] Converting page ${pageNumber}...`);

        const result = await converter(pageNumber, { responseType: 'buffer' });

        if (result.buffer && result.buffer.length > 0) {
          // Optimize with sharp
          const optimized = await optimizeImage(result.buffer);

          const sizeKB = optimized.length / 1024;

          images.push({
            pageNumber,
            base64: optimized.toString('base64'),
            mimeType: 'image/png',
            sizeKB,
          });

          console.log(`[PDF Converter] Page ${pageNumber}: ${sizeKB.toFixed(0)} KB`);
          pageNumber++;
        } else {
          hasMorePages = false;
        }
      } catch (error) {
        // pdf2pic throws when there are no more pages
        hasMorePages = false;
      }
    }

    if (images.length === 0) {
      throw new Error('Failed to extract any pages from PDF');
    }

    console.log('[PDF Converter] ✓ Converted', images.length, 'pages');
    console.log('[PDF Converter] Total size:', images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0), 'KB');
    console.log('[PDF Converter] ========================================');

    return images;
  } catch (error) {
    console.error('[PDF Converter] Error:', error);
    throw new Error(`PDF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function prepareImageForVision(
  imageBuffer: Buffer,
  pageNumber: number = 1
): Promise<PageImage> {
  console.log(`[Image Prep] Preparing image for vision (page ${pageNumber})...`);
  console.log(`[Image Prep] Original size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);

  const optimized = await optimizeImage(imageBuffer);
  const sizeKB = optimized.length / 1024;

  console.log(`[Image Prep] Optimized size: ${sizeKB.toFixed(0)} KB`);

  return {
    pageNumber,
    base64: optimized.toString('base64'),
    mimeType: 'image/png',
    sizeKB,
  };
}

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  let processed = sharp(buffer);

  // Resize if too large
  if (metadata.width && metadata.width > MAX_IMAGE_WIDTH) {
    processed = processed.resize(MAX_IMAGE_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  if (metadata.height && metadata.height > MAX_IMAGE_HEIGHT) {
    processed = processed.resize(null, MAX_IMAGE_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to PNG with good compression
  let optimized = await processed.png({ compressionLevel: 6 }).toBuffer();

  // If still too large, reduce quality further
  if (optimized.length / 1024 > MAX_IMAGE_SIZE_KB) {
    console.log('[Image Prep] Image still too large, applying additional compression...');
    optimized = await sharp(optimized)
      .resize(Math.floor(MAX_IMAGE_WIDTH * 0.8), null, { fit: 'inside' })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  return optimized;
}

export async function prepareMultipleImages(
  buffers: Buffer[],
  mimeTypes?: string[]
): Promise<PageImage[]> {
  console.log(`[Image Prep] Preparing ${buffers.length} images for vision...`);

  const images: PageImage[] = [];

  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    const mimeType = mimeTypes?.[i] || 'image/png';

    // Check if it's a PDF
    if (mimeType === 'application/pdf' || isPdf(buffer)) {
      console.log(`[Image Prep] Buffer ${i + 1} is PDF, converting...`);
      const pdfImages = await convertPdfToImages(buffer);
      // Adjust page numbers for concatenation
      for (const pdfImg of pdfImages) {
        images.push({
          ...pdfImg,
          pageNumber: images.length + 1,
        });
      }
    } else {
      // Regular image
      const image = await prepareImageForVision(buffer, images.length + 1);
      images.push(image);
    }
  }

  console.log(`[Image Prep] Total pages prepared: ${images.length}`);
  console.log(`[Image Prep] Total size: ${images.reduce((s, i) => s + i.sizeKB, 0).toFixed(0)} KB`);

  return images;
}

// Check if buffer is a PDF by magic bytes
function isPdf(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF';
}
