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
          { success: false, error: error.errors[0].message },
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

    // Create file URL (relative path for now)
    const fileUrl = `/tmp/${fileName}`;

    // Create Upload record in database
    const upload = await db.upload.create({
      data: {
        userId: child.userId,
        childId: childId,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        analysisStatus: "pending",
        uploadedAt: new Date(),
      },
    });

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
