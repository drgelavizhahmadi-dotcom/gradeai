import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { VISION_EXTRACTION_SYSTEM, VISION_EXTRACTION_PROMPT } from "@/lib/ai/prompts/vision-extraction-prompt";

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

    console.log(`[Extract API] Starting extraction for upload ${uploadId}, ${images.length} pages`);

    await db.upload.update({
      where: { id: uploadId },
      data: { analysisStatus: "extracting" },
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropic = new Anthropic({ apiKey });

    // Build content with all images
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mimeType,
          data: img.base64,
        },
      });
      content.push({
        type: "text",
        text: `[Page ${i + 1} of ${images.length}]`,
      });
    }

    content.push({
      type: "text",
      text: VISION_EXTRACTION_PROMPT,
    });

    console.log("[Extract API] Sending to Claude Vision...");
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: VISION_EXTRACTION_SYSTEM,
      messages: [{ role: "user", content }],
    });

    const durationMs = Date.now() - startTime;
    console.log(`[Extract API] Response in ${durationMs}ms, tokens: in=${response.usage.input_tokens} out=${response.usage.output_tokens}`);

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const extraction = textContent.text;
    console.log(`[Extract API] Extraction length: ${extraction.length} chars`);

    // Save extraction to extractedText field
    console.log("[Extract API] Saving to database...");
    await db.upload.update({
      where: { id: uploadId },
      data: {
        extractedText: extraction,
        analysisStatus: "extracted",
      },
    });
    console.log("[Extract API] Saved successfully");

    return NextResponse.json({
      success: true,
      extractionLength: extraction.length,
      durationMs,
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
