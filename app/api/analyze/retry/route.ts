import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateReportWithClaude } from "@/lib/ai/report/claude-report";
import { convertGermanGrade } from "@/lib/ocr/gradeConverter";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

// Validate retry request
const retryRequestSchema = z.object({
  uploadId: z.string().min(1, "uploadId required"),
});

export async function POST(request: NextRequest) {
  let uploadId: string | undefined;

  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validated = retryRequestSchema.parse(body);
    uploadId = validated.uploadId;

    console.log(`[Retry API] Starting retry for upload ${uploadId}`);

    // Get upload and verify ownership
    const upload = await db.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload || upload.userId !== userId) {
      console.error(`[Retry API] Upload not found or unauthorized: ${uploadId}`);
      return NextResponse.json(
        { success: false, error: "Upload not found" },
        { status: 404 }
      );
    }

    // Only allow retry for failed uploads
    if (upload.analysisStatus !== "failed") {
      return NextResponse.json(
        { success: false, error: `Cannot retry status: ${upload.analysisStatus}` },
        { status: 400 }
      );
    }

    console.log(`[Retry API] Upload status: failed, determining retry path...`);

    // Determine which step to resume from
    const hasExtractedText = !!upload.extractedText;
    const hasAnalysis = !!upload.analysis;

    // If no extraction, need to re-upload
    if (!hasExtractedText) {
      console.log(`[Retry API] No extracted text found, user needs to re-upload`);
      return NextResponse.json(
        {
          success: false,
          error: "Extraction data missing. Please re-upload the files.",
          needsReupload: true,
        },
        { status: 400 }
      );
    }

    // If extraction exists but no analysis, retry report generation
    if (!hasAnalysis) {
      console.log(`[Retry API] Retrying report generation...`);

      // Update status to analyzing
      await db.upload.update({
        where: { id: uploadId },
        data: { analysisStatus: "analyzing" },
      });

      // Ensure extractedText is treated as non-null string for TS
      const extractedText = upload.extractedText as string;

      // Generate report
      const result = await generateReportWithClaude(extractedText);

      if (!result.success || !result.report) {
        console.error(`[Retry API] Report generation failed:`, result.error);
        
        // Update to failed status
        await db.upload.update({
          where: { id: uploadId },
          data: {
            analysisStatus: "failed",
            errorMessage: result.error || "Report generation failed",
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: result.error || "Report generation failed",
          },
          { status: 500 }
        );
      }

      const report = result.report;

      console.log(`[Retry API] Report generated successfully`);

      // Extract grade for database
      const gradeValue = report.grade?.value;
      const gradeFloat = gradeValue ? convertGermanGrade(String(gradeValue)) || 0 : 0;

      // Extract teacher comment
      const mainComment = report.teacherFeedback?.mainComment;
      const teacherCommentText =
        typeof mainComment === "string" ? mainComment : mainComment?.text || "";

      // Save report to database
      await db.upload.update({
        where: { id: uploadId },
        data: {
          grade: gradeFloat,
          subject: report.test?.subject || "Unknown",
          teacherComment: teacherCommentText,
          analysis: report as any,
          analysisStatus: "completed",
          processedAt: new Date(),
          errorMessage: null, // Clear error message on success
        },
      });

      console.log(`[Retry API] Upload ${uploadId} successfully completed`);

      return NextResponse.json({
        success: true,
        uploadId,
        status: "completed",
        grade: gradeValue,
        durationMs: result.duration,
      });
    }

    // If we get here, something unexpected happened
    console.warn(
      `[Retry API] Upload has analysis but failed status: ${uploadId}`
    );

    return NextResponse.json(
      {
        success: true,
        uploadId,
        status: "completed",
        message: "Upload already completed",
      }
    );
  } catch (error) {
    console.error("[Retry API] Error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Retry failed";

    // Update DB if we have uploadId
    if (uploadId) {
      try {
        await db.upload.update({
          where: { id: uploadId },
          data: {
            analysisStatus: "failed",
            errorMessage,
          },
        });
      } catch (dbError) {
        console.error("[Retry API] Failed to update error status:", dbError);
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
