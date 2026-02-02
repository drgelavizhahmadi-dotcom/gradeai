import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { AI_REPORT_SYSTEM, AI_REPORT_PROMPT } from "@/lib/ai/prompts/ai-report-prompt";
import { convertGermanGrade } from "@/lib/ocr/gradeConverter";

export const runtime = "nodejs";
export const maxDuration = 60;

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    // Replace placeholder in prompt with actual extraction
    const prompt = AI_REPORT_PROMPT.replace("{visionExtraction}", rawExtraction);

    console.log("[Report API] Sending to Claude for report generation...");
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: AI_REPORT_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const durationMs = Date.now() - startTime;
    console.log(`[Report API] Response in ${durationMs}ms, tokens: in=${response.usage.input_tokens} out=${response.usage.output_tokens}`);

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Report API] No JSON found, response:", textContent.text.substring(0, 500));
      throw new Error("Invalid response format - no JSON found");
    }

    const report = JSON.parse(jsonMatch[0]);

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

    // Save report to database
    await db.upload.update({
      where: { id: uploadId },
      data: {
        grade: gradeFloat,
        subject: report.test?.subject || "Unknown",
        teacherComment: teacherCommentText,
        extractedText: JSON.stringify({
          student: report.student,
          test: report.test,
          teacherFeedback: report.teacherFeedback,
        }),
        analysis: report as any,
        analysisStatus: "completed",
        processedAt: new Date(),
      },
    });

    console.log("[Report API] Report saved to database");

    return NextResponse.json({
      success: true,
      durationMs,
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
