import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateReportWithClaude } from "@/lib/ai/report/claude-report";
import { convertGermanGrade } from "@/lib/ocr/gradeConverter";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      return NextResponse.json(
        { success: false, error: "uploadId required" },
        { status: 400 }
      );
    }

    // Get upload with extraction
    const upload = await db.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Upload not found" },
        { status: 404 }
      );
    }

    // Read extraction from extractedText field
    const rawExtraction = upload.extractedText;

    if (!rawExtraction) {
      return NextResponse.json(
        { success: false, error: "No extraction found. Run extract first." },
        { status: 400 }
      );
    }

    console.log(`[Report API] Starting report for upload ${uploadId}, extraction: ${rawExtraction.length} chars`);

    await db.upload.update({
      where: { id: uploadId },
      data: { analysisStatus: "analyzing" },
    });

    const result = await generateReportWithClaude(rawExtraction);

    if (!result.success || !result.report) {
      throw new Error(result.error || "Report generation failed");
    }

    const report = result.report;

    console.log("[Report API] Report generated:");
    console.log("[Report API] Student:", report.student?.name);
    console.log("[Report API] Grade:", report.grade?.value);
    console.log("[Report API] Strengths:", report.strengths?.length);
    console.log("[Report API] Weaknesses:", report.weaknesses?.length);

    // Extract grade for database
    const gradeValue = report.grade?.value;
    const gradeFloat = gradeValue ? convertGermanGrade(String(gradeValue)) || 0 : 0;

    // Extract teacher comment
    const mainComment = report.teacherFeedback?.mainComment;
    const teacherCommentText = typeof mainComment === "string"
      ? mainComment
      : mainComment?.text || "";

    // Save report to database (don't overwrite extractedText with report data)
    await db.upload.update({
      where: { id: uploadId },
      data: {
        grade: gradeFloat,
        subject: report.test?.subject || "Unknown",
        teacherComment: teacherCommentText,
        analysis: report as any,
        analysisStatus: "completed",
        processedAt: new Date(),
      },
    });

    console.log("[Report API] Report saved to database");

    return NextResponse.json({
      success: true,
      durationMs: result.duration,
      grade: gradeValue,
    });
  } catch (error) {
    console.error("[Report API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Report generation failed",
      },
      { status: 500 }
    );
  }
}
