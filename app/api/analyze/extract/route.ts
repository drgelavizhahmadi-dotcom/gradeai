import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { extractWithVisionOCR } from "@/lib/ai/vision/vision-ocr-extract";
import { extractWithClaude } from "@/lib/ai/vision/claude-extract";
import { analyzeTestComplete } from "@/lib/ai/analyze-complete";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await request.json();
    const { uploadId, images, language } = body;

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

    console.log(`[Extract API] Starting analysis for upload ${uploadId}, ${images.length} pages`);

    await db.upload.update({
      where: { id: uploadId },
      data: { analysisStatus: "extracting" },
    });

    // LAYER 1: Vision Extraction
    console.log("[Extract API] Layer 1: Vision Extraction...");
    let extractResult: { success: boolean; error?: string; extraction: string; duration: number; provider: string; confidence?: number } = await extractWithVisionOCR(images);

    if (!extractResult.success || (extractResult.confidence !== undefined && extractResult.confidence < 0.85)) {
      console.log("[Extract API] Vision OCR insufficient, trying Claude fallback...");
      extractResult = await extractWithClaude(images);
    }

    if (!extractResult.success) {
      console.error(`[Extract API] Vision extraction failed: ${extractResult.error}`);
      await db.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: "failed",
          errorMessage: extractResult.error || "Unknown extraction error",
        },
      });
      throw new Error(extractResult.error || "Unknown extraction error");
    }

    console.log(`[Extract API] Extraction complete: ${extractResult.extraction.length} chars`);

    // LAYER 2: Comprehensive Analysis (+ optional translation)
    console.log("[Extract API] Layer 2: Comprehensive Analysis...");
    const analysisResult = await analyzeTestComplete(extractResult.extraction, {
      language: language || 'de',
    });

    if (!analysisResult.success) {
      const errorMsg = analysisResult.error || "Unknown analysis error";
      console.error(`[Extract API] Analysis failed: ${errorMsg}`);
      await db.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: "failed",
          errorMessage: errorMsg,
          extractedText: extractResult.extraction,
        },
      });
      throw new Error(errorMsg);
    }

    console.log(`[Extract API] Analysis complete`);

    // Save to database
    const updateData: any = {
      extractedText: extractResult.extraction,
      analysisStatus: "completed",
      processedAt: new Date(),
    };

    if (analysisResult.report) {
      // Store translated report in analysis field
      // German report is embedded in analysis._germanOriginal for now
      // TODO: Once analysisGerman column exists in DB, store separately
      const reportWithGerman = {
        ...analysisResult.report,
        _germanOriginal: analysisResult.reportGerman,
      };
      updateData.analysis = reportWithGerman;
      updateData.subject = analysisResult.report.test?.subject || analysisResult.reportGerman?.test?.subject;

      // Get grade from German report (more reliable)
      const gradeValue = analysisResult.reportGerman?.grade?.value || analysisResult.report?.grade?.value;
      if (gradeValue) {
        const gradeNum = parseFloat(gradeValue);
        if (!isNaN(gradeNum)) {
          updateData.grade = gradeNum;
        }
      }
    }

    await db.upload.update({
      where: { id: uploadId },
      data: updateData,
    });
    console.log("[Extract API] Saved successfully");

    return NextResponse.json({
      success: true,
      extractionLength: extractResult.extraction.length,
      reportGenerated: !!analysisResult.report,
      language: language || 'de',
      durationMs: extractResult.duration + analysisResult.timing.total,
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
