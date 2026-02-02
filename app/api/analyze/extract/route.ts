import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { extractWithGemini } from "@/lib/ai/vision/gemini-extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await request.json();
    const { uploadId, images } = body;

    if (!uploadId || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: "uploadId and images array required" },
        { status: 400 }
      );
    }

    // Verify upload belongs to user
    const upload = await db.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Upload not found" },
        { status: 404 }
      );
    }

    console.log(`[Extract API] Starting Gemini extraction for upload ${uploadId}, ${images.length} pages`);

    await db.upload.update({
      where: { id: uploadId },
      data: { analysisStatus: "extracting" },
    });

    const result = await extractWithGemini(images);

    if (!result.success) {
      throw new Error(result.error || "Extraction failed");
    }

    console.log(`[Extract API] Extraction length: ${result.extraction.length} chars`);

    // Save extraction to extractedText field
    console.log("[Extract API] Saving to database...");
    await db.upload.update({
      where: { id: uploadId },
      data: {
        extractedText: result.extraction,
        analysisStatus: "extracted",
      },
    });
    console.log("[Extract API] Saved successfully");

    return NextResponse.json({
      success: true,
      extractionLength: result.extraction.length,
      durationMs: result.duration,
    });
  } catch (error) {
    console.error("[Extract API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Extraction failed",
      },
      { status: 500 }
    );
  }
}
