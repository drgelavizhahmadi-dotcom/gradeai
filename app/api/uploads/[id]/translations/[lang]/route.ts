// app/api/uploads/[id]/translations/[lang]/route.ts
// GET endpoint to check for cached report translations in DB

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lang: string }> }
) {
    try {
        const session = await requireAuth()
        const { id: uploadId, lang: language } = await params

        if (!uploadId || !language) {
            return NextResponse.json(
                { success: false, error: 'Missing uploadId or language' },
                { status: 400 }
            )
        }

        // Verify upload belongs to user
        const upload = await db.upload.findUnique({
            where: { id: uploadId },
            select: { userId: true },
        })

        if (!upload || upload.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Upload not found' },
                { status: 404 }
            )
        }

        // Look up cached translation
        const cached = await db.reportTranslation.findUnique({
            where: {
                uploadId_language: { uploadId, language },
            },
        })

        if (cached) {
            return NextResponse.json({
                success: true,
                found: true,
                translatedReport: cached.report,
                cachedAt: cached.createdAt,
            })
        }

        return NextResponse.json({
            success: true,
            found: false,
        })
    } catch (error) {
        console.error('[Translation Cache] Error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check translation cache',
            },
            { status: 500 }
        )
    }
}
