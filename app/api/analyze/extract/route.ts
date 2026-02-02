import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { analyzeTest } from "@/lib/ai/analyze";

export const runtime = "nodejs";
export const maxDuration = 300;

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

    console.log(`[Extract API] Starting extraction for upload ${uploadId}, ${images.length} pages`);

    await db.upload.update({
      where: { id: uploadId },
      data: { analysisStatus: "extracting" },
    });

    // Run full two-layer analysis (extraction + report generation)
    console.log(`[Extract API] Starting two-layer analysis...`);
    const analysisResult = await analyzeTest(images);

    if (!analysisResult.success) {
      console.error(`[Extract API] Analysis failed: ${analysisResult.error}`);
      await db.upload.update({
        where: { id: uploadId },
        data: {
          analysisStatus: "failed",
          errorMessage: analysisResult.error,
        },
      });
      throw new Error(analysisResult.error);
    }

    console.log(`[Extract API] Analysis complete - Vision: ${analysisResult.providers.vision}, Report: ${analysisResult.providers.report}`);
    console.log(`[Extract API] Extraction length: ${analysisResult.extraction.length} chars`);
    console.log(`[Extract API] Report generated: ${analysisResult.report ? 'YES' : 'NO'}`);

    // Save both extraction and report to database
    console.log("[Extract API] Saving to database...");
    const updateData: any = {
      extractedText: analysisResult.extraction,
      analysisStatus: "completed",
      processedAt: new Date(),
    };

    if (analysisResult.report) {
      updateData.analysis = JSON.stringify(analysisResult.report);
      updateData.subject = analysisResult.report.test?.subject;
      // Convert grade string to number
      if (analysisResult.report.grade?.value) {
        const gradeNum = parseFloat(analysisResult.report.grade.value);
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
      extractionLength: analysisResult.extraction.length,
      reportGenerated: !!analysisResult.report,
      durationMs: analysisResult.timing.total,
      providers: analysisResult.providers,
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
