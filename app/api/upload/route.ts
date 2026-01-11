import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { db } from "@/lib/db";

// Validation schema for file uploads
const uploadSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
});

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const childId = formData.get("childId") as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!childId) {
      return NextResponse.json(
        { success: false, error: "Child ID is required" },
        { status: 400 }
      );
    }

    // Validate childId format
    try {
      uploadSchema.parse({ childId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: error.issues[0].message },
          { status: 400 }
        );
      }
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only JPG, PNG, and PDF files are allowed",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 10MB limit",
        },
        { status: 400 }
      );
    }

    // Verify child exists in database
    const child = await db.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return NextResponse.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${originalName}`;

    // Ensure tmp directory exists
    const tmpDir = join(process.cwd(), "tmp");
    try {
      await mkdir(tmpDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Save file to tmp directory
    const filePath = join(tmpDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create Upload record in database
    const upload = await db.upload.create({
      data: {
        userId: child.userId,
        childId: childId,
        fileName: file.name,
        fileUrl: filePath, // Store absolute path instead of relative
        fileSize: file.size,
        mimeType: file.type,
        analysisStatus: "pending",
        uploadedAt: new Date(),
      },
    });

    console.log(`[Upload API] Upload created successfully: ${upload.id}`);

    // Trigger analysis asynchronously (non-blocking)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const analyzeUrl = `${baseUrl}/api/analyze`;
    const analyzePayload = { uploadId: upload.id };

    console.log(`[Upload API] Triggering analysis...`);
    console.log(`[Upload API] Analyze URL: ${analyzeUrl}`);
    console.log(`[Upload API] Analyze payload:`, analyzePayload);

    fetch(analyzeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyzePayload),
    })
      .then(async (res) => {
        console.log(`[Upload API] Analyze response status: ${res.status}`);
        const contentType = res.headers.get('content-type');
        console.log(`[Upload API] Analyze response content-type: ${contentType}`);

        if (!contentType?.includes('application/json')) {
          const text = await res.text();
          console.error(`[Upload API] Expected JSON but got: ${text.substring(0, 200)}`);
        } else {
          const data = await res.json();
          console.log(`[Upload API] Analyze response:`, data);
        }
      })
      .catch(err => {
        console.error('[Upload API] Analysis trigger failed:', err);
        console.error('[Upload API] Error details:', err.message, err.cause);
      });

    console.log(`[Upload API] Analysis triggered for upload: ${upload.id}`);

    // Return success response with upload ID
    return NextResponse.json({
      success: true,
      uploadId: upload.id,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Handle Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { success: false, error: "Duplicate upload detected" },
          { status: 409 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
