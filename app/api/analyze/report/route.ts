import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateReportWithClaude } from "@/lib/ai/report/claude-report";
import { convertGermanGrade } from "@/lib/ocr/gradeConverter";
import { z } from "zod";
import { RateLimiter, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

// ===== REQUEST VALIDATION WITH ZOD =====
const reportRequestSchema = z.object({
  uploadId: z.string().min(1, "uploadId required"),
});

// ===== RATE LIMITING =====
const reportRateLimiter = new RateLimiter(15, 60 * 1000); // 15 requests per minute per IP

export async function POST(request: NextRequest) {
  let uploadId: string | undefined;

  try {
    // ===== RATE LIMITING CHECK =====
    const clientIp = getClientIP(request);
    const rateLimitResult = reportRateLimiter.check(clientIp);

    if (!rateLimitResult.success) {
      console.warn(`[Report API] Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many requests. Please try again later.",
          errorCode: "ERR_15",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // ===== AUTHENTICATION =====
    const session = await requireAuth();
    const userId = session.user.id;

    // ===== REQUEST VALIDATION =====
    const body = await request.json();
    
    let validated;
    try {
      validated = reportRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request parameters",
            errorCode: "ERR_13",
            issues: error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    uploadId = validated.uploadId;

    // Get upload with extraction
    const upload = await db.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Upload not found", errorCode: "ERR_14" },
        { status: 404 }
      );
    }

    // Read extraction from extractedText field
    const rawExtraction = upload.extractedText;

    if (!rawExtraction) {
      return NextResponse.json(
        { success: false, error: "No extraction found", errorCode: "ERR_17" },
        { status: 400 }
      );
    }

    console.log(
      `[Report API] Starting report for upload ${uploadId}, extraction: ${rawExtraction.length} chars`
    );

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
    const teacherCommentText =
      typeof mainComment === "string"
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
        errorMessage: null, // Clear error message on success
      },
    });

    console.log("[Report API] Report saved to database");

    // 1. Get user's preferred language from DB (ensures we have the latest)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { language: true }
    });

    const targetLanguage = user?.language || "de";

    // 2. Proactively translate if not German (includes English as requested)
    if (targetLanguage !== "de") {
      console.log(`[Report API] Proactively translating to: ${targetLanguage}`);
      try {
        const { translateReport } = await import("@/lib/ai/analyze-complete");
        const translationResult = await translateReport(report, targetLanguage as any);

        if (translationResult.success) {
          await db.reportTranslation.upsert({
            where: {
              uploadId_language: { uploadId, language: targetLanguage },
            },
            create: {
              uploadId,
              language: targetLanguage,
              report: translationResult.translatedReport as any,
            },
            update: {
              report: translationResult.translatedReport as any,
            },
          });
          console.log(`[Report API] Proactive translation saved for ${targetLanguage}`);
        }
      } catch (transError) {
        console.error("[Report API] Proactive translation failed:", transError);
        // We don't fail the whole request since German report is already successfully saved
      }
    }

    return NextResponse.json({
      success: true,
      durationMs: result.duration,
      grade: gradeValue,
    });
  } catch (error) {
    console.error("[Report API] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Report generation failed";

    if (uploadId) {
      try {
        await db.upload.update({
          where: { id: uploadId },
          data: {
            analysisStatus: "failed",
            errorMessage: errorMessage,
          },
        });
      } catch (dbError) {
        console.error("[Report API] Failed to update error status:", dbError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorCode: (error as any).errorCode || "ERR_17",
      },
      { status: 500 }
    );
  }
}
