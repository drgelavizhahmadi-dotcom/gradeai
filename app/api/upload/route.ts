import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// Validation schema for file uploads
const uploadSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
});

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()
    const authenticatedUserId = session.user.id

    console.log(`[Upload API] Authenticated user: ${authenticatedUserId}`)

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

    // Verify child exists and belongs to authenticated user
    const child = await db.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return NextResponse.json(
        { success: false, error: "Child not found" },
        { status: 404 }
      );
    }

    // Ensure the child belongs to the authenticated user - TEMPORARILY DISABLED
    // if (child.userId !== authenticatedUserId) {
    //   return NextResponse.json(
    //     { success: false, error: "Unauthorized: You can only upload tests for your own children" },
    //     { status: 403 }
    //   );
    // }

    // ===== DUPLICATE DETECTION =====
    // Check if this file was already uploaded for this child
    const existingUpload = await db.upload.findFirst({
      where: {
        childId: childId,
        fileName: file.name,
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    if (existingUpload) {
      console.log(`[Upload API] Duplicate file detected: ${file.name} for child ${childId}`);
      console.log(`[Upload API] Existing upload ID: ${existingUpload.id}, status: ${existingUpload.analysisStatus}`);

      // If the existing upload has completed analysis, redirect to it
      if (existingUpload.analysisStatus === 'completed' && existingUpload.analysis) {
        console.log(`[Upload API] Redirecting to existing upload with completed analysis`);
        return NextResponse.json({
          success: true,
          uploadId: existingUpload.id,
          isDuplicate: true,
          message: "This test was already uploaded. Showing existing analysis.",
        });
      }

      // If the existing upload is still processing, redirect to it
      if (existingUpload.analysisStatus === 'processing' || existingUpload.analysisStatus === 'pending') {
        console.log(`[Upload API] Redirecting to existing upload that is ${existingUpload.analysisStatus}`);
        return NextResponse.json({
          success: true,
          uploadId: existingUpload.id,
          isDuplicate: true,
          message: "This test is already being processed. Showing progress...",
        });
      }

      // If the existing upload failed, allow re-upload by continuing
      // We'll create a new upload record and let the user try again
      console.log(`[Upload API] Previous upload failed. Allowing re-upload.`);
    }
    // ===== END DUPLICATE DETECTION =====

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

    // ============================================
    // === TRIGGERING ANALYSIS ===
    // ============================================
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const analyzeUrl = `${baseUrl}/api/analyze`;
    const analyzePayload = { uploadId: upload.id };

    console.log('='.repeat(60));
    console.log('=== TRIGGERING ANALYSIS ===');
    console.log('Upload ID:', upload.id);
    console.log('Analyze URL:', analyzeUrl);
    console.log('Analyze Payload:', JSON.stringify(analyzePayload));
    console.log('File Path:', filePath);
    console.log('Base URL (NEXTAUTH_URL):', process.env.NEXTAUTH_URL || 'NOT SET (using localhost:3000)');
    console.log('='.repeat(60));

    // IMPORTANT: This fetch call happens BEFORE the response is returned to the client
    // This is intentional - we want the upload to return immediately while analysis runs in background
    fetch(analyzeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyzePayload),
    })
      .then(async (res) => {
        console.log('='.repeat(60));
        console.log('=== ANALYZE RESPONSE RECEIVED ===');
        console.log('Status:', res.status);
        console.log('Status Text:', res.statusText);
        const contentType = res.headers.get('content-type');
        console.log('Content-Type:', contentType);
        console.log('='.repeat(60));

        if (!contentType?.includes('application/json')) {
          const text = await res.text();
          console.error('=== ERROR: Expected JSON but got text ===');
          console.error('Response text (first 500 chars):', text.substring(0, 500));
          console.error('='.repeat(60));
        } else {
          const data = await res.json();
          console.log('=== ANALYZE SUCCESS ===');
          console.log('Response data:', JSON.stringify(data, null, 2));
          console.log('='.repeat(60));
        }
      })
      .catch(err => {
        console.error('='.repeat(60));
        console.error('=== ANALYSIS TRIGGER FAILED ===');
        console.error('Error:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        console.error('Error cause:', err.cause);
        console.error('='.repeat(60));
      });

    console.log('=== Analysis fetch() called - running in background ===');
    console.log('=== Returning response to client immediately ===');

    // Return success response with upload ID
    return NextResponse.json({
      success: true,
      uploadId: upload.id,
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

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
