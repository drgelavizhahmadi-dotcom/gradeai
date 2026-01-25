import sharp from 'sharp'
import { extractTextFromImage } from './vision'

export interface VisualEvidencePackage {
  grade_detected: number | null
  marks: Array<'✓' | '✗' | '○'>
  points: string | null
  teacher_comment: string | null
  correction_density: number
  answer_regions: Array<{ x: number; y: number; width: number; height: number; score: number }>
  confidence: number
}

interface ImageData {
  width: number
  height: number
  data: Buffer // raw RGBA
}

async function getImageData(buffer: Buffer): Promise<ImageData> {
  // Downscale large images to speed up pixel scanning without losing key signals
  const targetMaxWidth = 1400
  const img = sharp(buffer).resize({ width: targetMaxWidth, withoutEnlargement: true })
  const { data: raw, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const width = info.width
  const height = info.height
  if (!width || !height) throw new Error('Invalid image: width/height missing')
  return { width, height, data: raw }
}

function isRed(r: number, g: number, b: number): boolean {
  // Emphasize teacher red ink; allow for scanned desaturation
  return r > 150 && r > g + 40 && r > b + 40
}

function isBlue(r: number, g: number, b: number): boolean {
  // Detect blue pen ink
  return b > 140 && b > r + 20 && b > g + 10
}

function computeMaskRatio(img: ImageData, predicate: (r: number, g: number, b: number) => boolean): number {
  const { data, width, height } = img
  let hits = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (predicate(r, g, b)) hits++
    }
  }
  return hits / (width * height)
}

function cropToBuffer(img: ImageData, rect: { x: number; y: number; width: number; height: number }): Buffer {
  const { data, width } = img
  const out = Buffer.alloc(rect.width * rect.height * 4)
  for (let yy = 0; yy < rect.height; yy++) {
    for (let xx = 0; xx < rect.width; xx++) {
      const srcX = Math.min(Math.max(rect.x + xx, 0), width - 1)
      const srcY = rect.y + yy
      const si = (srcY * width + srcX) * 4
      const di = (yy * rect.width + xx) * 4
      data.copy(out, di, si, si + 4)
    }
  }
  return out
}

const OCR_CROP_TIMEOUT_MS = 8000 // 8s timeout per crop OCR to stay within buildVisualEvidencePackage 10s budget

async function ocrCropToText(cropRawRgba: Buffer, rect: { width: number; height: number }): Promise<string> {
  // Convert raw RGBA to PNG buffer for OCR
  const png = await sharp(cropRawRgba, { raw: { width: rect.width, height: rect.height, channels: 4 } })
    .png()
    .toBuffer()

  // Add timeout to prevent hanging on Vision API
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`OCR crop timeout after ${OCR_CROP_TIMEOUT_MS}ms`)), OCR_CROP_TIMEOUT_MS)
  })

  try {
    const { text } = await Promise.race([
      extractTextFromImage(png),
      timeoutPromise,
    ])
    return text
  } catch (error) {
    console.warn('[Visual] OCR crop failed:', error instanceof Error ? error.message : String(error))
    return '' // Return empty on timeout/error - don't block the entire analysis
  }
}

async function detectGrade(img: ImageData): Promise<number | null> {
  // Heuristic: grades often appear in corners; try top-right then top-left
  const rects = [
    { x: Math.floor(img.width * 0.65), y: 0, width: Math.floor(img.width * 0.35), height: Math.floor(img.height * 0.25) },
    { x: 0, y: 0, width: Math.floor(img.width * 0.35), height: Math.floor(img.height * 0.25) },
  ]
  for (const rect of rects) {
    const crop = cropToBuffer(img, rect)
    const text = await ocrCropToText(crop, rect)
    const noteMatch = text.match(/(?:Note|Grade|Punkte)\s*[:\-]?\s*(\d{1,2})(?:\s*\/\s*(\d{1,2}))?/i)
    if (noteMatch) {
      const val = parseInt(noteMatch[1], 10)
      if (!isNaN(val)) return val
    }
    const circledNum = text.match(/(^|\s)([1-6])(\s|$)/)
    if (circledNum) {
      const val = parseInt(circledNum[2], 10)
      if (!isNaN(val)) return val
    }
  }
  return null
}

async function detectPoints(img: ImageData): Promise<string | null> {
  // Search across header area for patterns like 12/15
  const rect = { x: Math.floor(img.width * 0.5), y: 0, width: Math.floor(img.width * 0.5), height: Math.floor(img.height * 0.3) }
  const crop = cropToBuffer(img, rect)
  const text = await ocrCropToText(crop, rect)
  const m = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})/)
  return m ? `${m[1]}/${m[2]}` : null
}

function detectAnswerRegions(img: ImageData): Array<{ x: number; y: number; width: number; height: number; score: number }> {
  // Grid scan for red/blue density; flag cells with high correction density as answer regions
  const cells: Array<{ x: number; y: number; width: number; height: number; score: number }> = []
  // Coarser grid to reduce compute time; still captures marked regions
  const cols = 6, rows = 9
  const cellW = Math.floor(img.width / cols)
  const cellH = Math.floor(img.height / rows)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rect = { x: c * cellW, y: r * cellH, width: cellW, height: cellH }
      let hits = 0
      for (let yy = rect.y; yy < rect.y + rect.height; yy++) {
        for (let xx = rect.x; xx < rect.x + rect.width; xx++) {
          const i = (yy * img.width + xx) * 4
          const rVal = img.data[i], gVal = img.data[i + 1], bVal = img.data[i + 2]
          if (isRed(rVal, gVal, bVal) || isBlue(rVal, gVal, bVal)) hits++
        }
      }
      const score = hits / (rect.width * rect.height)
        if (score > 0.08) cells.push({ ...rect, score })
    }
  }
  // Merge adjacent high-score cells into larger regions (simple pass)
  cells.sort((a, b) => a.y - b.y || a.x - b.x)
  const merged: typeof cells = []
  for (const cell of cells) {
    const last = merged[merged.length - 1]
    if (last && cell.y <= last.y + last.height && cell.x <= last.x + last.width + cell.width) {
      // Expand
      last.width = Math.max(last.width, cell.x + cell.width - last.x)
      last.height = Math.max(last.height, cell.y + cell.height - last.y)
      last.score = Math.max(last.score, cell.score)
    } else {
      merged.push({ ...cell })
    }
  }
  return merged
}

async function detectTeacherComment(img: ImageData): Promise<string | null> {
  // Scan bottom quarter where comments are often written
  const rect = { x: 0, y: Math.floor(img.height * 0.75), width: img.width, height: Math.floor(img.height * 0.25) }
  const crop = cropToBuffer(img, rect)
  const text = await ocrCropToText(crop, rect)
  const sanitized = text.replace(/[\s\n]+/g, ' ').trim()
  return sanitized.length > 4 ? sanitized : null
}

export async function buildVisualEvidencePackage(buffer: Buffer): Promise<VisualEvidencePackage> {
  const img = await getImageData(buffer)
  const redRatio = computeMaskRatio(img, isRed)
  const blueRatio = computeMaskRatio(img, isBlue)
  const correctionDensity = Math.min(1, redRatio + blueRatio)

  const [grade, points, comment] = await Promise.all([
    detectGrade(img),
    detectPoints(img),
    detectTeacherComment(img),
  ])

  const regions = detectAnswerRegions(img)

  // Marks classification is non-trivial; placeholder heuristic: presence inferred from densities
  const marks: Array<'✓' | '✗' | '○'> = []
  if (redRatio > 0.01) marks.push('✗')
  if (blueRatio > 0.008) marks.push('✓')

  const confidenceBase = 0.85
  const confidenceBoost = Math.min(0.12, correctionDensity * 0.5)
  const confidence = Math.min(0.99, confidenceBase + confidenceBoost)

  return {
    grade_detected: grade,
    marks,
    points,
    teacher_comment: comment,
    correction_density: Number(correctionDensity.toFixed(3)),
    answer_regions: regions,
    confidence,
  }
}
