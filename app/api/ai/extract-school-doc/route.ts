import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { extractTextFromImage } from '@/lib/ocr/vision'
import { convertPdfToImages } from '@/lib/utils/pdf-to-images'

export const maxDuration = 300

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

function extractJSON(text: string): any {
  try {
    return JSON.parse(text.trim())
  } catch {}

  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch {}
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {}
  }

  throw new Error('Could not extract valid JSON from response')
}

const EXTRACTION_PROMPT = `You are an AI assistant that extracts key information from school documents sent to parents.

Analyze the OCR-extracted text from a school document and extract:
1. **category** - One of: meeting, permission, payment, event, info, health, reportCard
2. **title** - A short descriptive title for the document (max 80 chars)
3. **summary** - A 1-2 sentence summary of what the document says
4. **actionNeeded** - What the parent needs to do (if anything). null if no action required.
5. **deadline** - The deadline date in ISO format (YYYY-MM-DD) if mentioned. null if no deadline.
6. **details** - Any additional structured details (amounts, locations, times, contacts)

The documents are from German schools, so text will be in German. Write the title, summary, and actionNeeded in German.

Respond with ONLY valid JSON in this exact format:
{
  "category": "meeting",
  "title": "Elternabend am 15. März",
  "summary": "Einladung zum Elternabend...",
  "actionNeeded": "Bitte bis zum 10. März zusagen",
  "deadline": "2026-03-10",
  "details": {}
}`

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { documentId, imageBase64, mimeType } = await request.json()

    if (!documentId || !imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Missing documentId or imageBase64' },
        { status: 400 }
      )
    }

    // Verify document belongs to user
    const document = await db.schoolDocument.findUnique({
      where: { id: documentId, userId: session.user.id },
    })
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    console.log(`[ExtractSchoolDoc] Starting extraction for document ${documentId}`)
    const startTime = Date.now()

    // Step 1: OCR the image (or PDF pages) with Google Vision
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const isPdf = mimeType === 'application/pdf' || imageBuffer.toString('ascii', 0, 4) === '%PDF'
    let ocrText = ''

    try {
      if (isPdf) {
        console.log(`[ExtractSchoolDoc] PDF detected, converting pages to images...`)
        const pages = await convertPdfToImages(imageBuffer)
        const pageTexts: string[] = []
        for (const page of pages) {
          const pageBuffer = Buffer.from(page.base64, 'base64')
          const result = await extractTextFromImage(pageBuffer)
          if (result.text.trim()) pageTexts.push(result.text)
        }
        ocrText = pageTexts.join('\n\n')
        console.log(`[ExtractSchoolDoc] PDF OCR done: ${pages.length} pages, ${ocrText.length} chars`)
      } else {
        const ocrResult = await extractTextFromImage(imageBuffer)
        ocrText = ocrResult.text
        console.log(`[ExtractSchoolDoc] OCR done: ${ocrText.length} chars, confidence: ${(ocrResult.confidence * 100).toFixed(1)}%`)
      }
    } catch (ocrError) {
      console.error('[ExtractSchoolDoc] OCR failed:', ocrError)
      // If OCR fails, still save the document but with minimal data
      await db.schoolDocument.update({
        where: { id: documentId },
        data: {
          category: 'info',
          title: document.fileName,
          summary: 'OCR-Extraktion fehlgeschlagen. Bitte erneut versuchen.',
          status: 'extracted',
        },
      })
      return NextResponse.json({
        success: true,
        document: { ...document, category: 'info', title: document.fileName, status: 'extracted' },
        extracted: null,
        duration: Date.now() - startTime,
      })
    }

    if (!ocrText.trim()) {
      await db.schoolDocument.update({
        where: { id: documentId },
        data: {
          category: 'info',
          title: document.fileName,
          summary: 'Kein Text im Dokument erkannt.',
          status: 'extracted',
        },
      })
      return NextResponse.json({
        success: true,
        document: { ...document, category: 'info', title: document.fileName, status: 'extracted' },
        extracted: null,
        duration: Date.now() - startTime,
      })
    }

    // Step 2: Send OCR text to DeepSeek for structured extraction
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `Extract information from this school document. Here is the OCR-extracted text:\n\n${ocrText}`,
        },
      ],
    })

    const responseText = response.choices[0]?.message?.content || ''
    let extracted: any

    try {
      extracted = extractJSON(responseText)
    } catch {
      extracted = {
        category: 'info',
        title: document.fileName,
        summary: 'Dokument wurde hochgeladen',
        actionNeeded: null,
        deadline: null,
        details: {},
      }
    }

    // Determine status based on extraction
    const newStatus = extracted.actionNeeded || extracted.deadline ? 'action_needed' : 'extracted'

    // Update document with extracted data
    const updated = await db.schoolDocument.update({
      where: { id: documentId },
      data: {
        category: extracted.category || 'info',
        title: extracted.title || document.fileName,
        summary: extracted.summary || null,
        actionNeeded: extracted.actionNeeded || null,
        deadline: extracted.deadline ? new Date(extracted.deadline) : null,
        extractedData: extracted,
        status: newStatus,
      },
    })

    const duration = Date.now() - startTime
    console.log(`[ExtractSchoolDoc] Done in ${duration}ms - category: ${extracted.category}, status: ${newStatus}`)

    return NextResponse.json({
      success: true,
      document: updated,
      extracted,
      duration,
    })
  } catch (error) {
    console.error('[ExtractSchoolDoc] Error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    )
  }
}
