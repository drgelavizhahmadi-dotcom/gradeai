import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { extractWithVisionOCR } from "@/lib/ai/vision/vision-ocr-extract";
import { extractWithClaude } from "@/lib/ai/vision/claude-extract";
import { analyzeTestComplete } from "@/lib/ai/analyze-complete";
import { z } from "zod";
import { RateLimiter, getClientIP } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

// ===== REQUEST VALIDATION WITH ZOD =====
const extractRequestSchema = z.object({
  uploadId: z.string().min(1, "uploadId required"),
  images: z.array(
    z.object({
      base64: z.string(),
      mimeType: z.enum(["image/jpeg", "image/png"]),
      pageNumber: z.number().positive(),
    })
  ).min(1, "At least one image required"),
  language: z.enum(["de", "en", "ar", "tr", "ro", "ru", "fa", "ku", "kmr"]).default("de"),
});

// ===== RATE LIMITING =====
const extractRateLimiter = new RateLimiter(20, 60 * 1000); // 20 requests per minute per IP

export async function POST(request: NextRequest) {
  let uploadId: string | undefined;

  try {
    // ===== RATE LIMITING CHECK =====
    const clientIp = getClientIP(request);
    const rateLimitResult = extractRateLimiter.check(clientIp);

    if (!rateLimitResult.success) {
      console.warn(`[Extract API] Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many requests. Please try again later.",
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
      validated = extractRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request parameters",
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

    const { uploadId: validatedUploadId, images, language } = validated;
    uploadId = validatedUploadId;

    // ===== AUTHORIZATION CHECK =====
    const upload = await db.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Upload not found" },
        { status: 404 }
      );
    }

    console.log(
      `[Extract API] Starting analysis for upload ${uploadId}, ${images.length} pages`
    );

    await db.upload.update({
      where: { id: uploadId },
      data: { analysisStatus: "extracting" },
    });

    // LAYER 1: Vision Extraction
    console.log("[Extract API] Layer 1: Vision Extraction...");
    let extractResult: {
      success: boolean;
      error?: string;
      extraction: string;
      duration: number;
      provider: string;
      confidence?: number;
    } = await extractWithVisionOCR(images);

    if (
      !extractResult.success ||
      (extractResult.confidence !== undefined && extractResult.confidence < 0.85)
    ) {
      console.log(
        "[Extract API] Vision OCR insufficient, trying Claude fallback..."
      );
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
      language: language || "de",
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
      const reportWithGerman = {
        ...analysisResult.report,
        _germanOriginal: analysisResult.reportGerman,
      };
      updateData.analysis = reportWithGerman;
      updateData.subject =
        analysisResult.report.test?.subject ||
        analysisResult.reportGerman?.test?.subject;

      const gradeValue =
        analysisResult.reportGerman?.grade?.value ||
        analysisResult.report?.grade?.value;
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
      language: language || "de",
      durationMs: extractResult.duration + analysisResult.timing.total,
    });
  } catch (error) {
    console.error("[Extract API] Error:", error);

    // Update DB if uploadId is available
    if (uploadId) {
      try {
        await db.upload.update({
          where: { id: uploadId },
          data: {
            analysisStatus: "failed",
            errorMessage: error instanceof Error ? error.message : "Extraction failed",
          },
        });
      } catch (dbError) {
        console.error("[Extract API] Failed to update error status:", dbError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Extraction failed",
      },
      { status: 500 }
    );
  }
}
