import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { analyzeUploadBuffer } from "@/lib/analysis";
import { uploadFileToStorage } from "@/lib/storage";

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

    // Ensure the child belongs to the authenticated user
    if (child.userId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You can only upload tests for your own children" },
        { status: 403 }
      );
    }

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
      console.log(`[Upload API] Previous upload failed. Allowing re-upload.`);
    }
    // ===== END DUPLICATE DETECTION =====

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create Upload record in database FIRST (without fileUrl)
    const upload = await db.upload.create({
      data: {
        userId: child.userId,
        childId: childId,
        fileName: file.name,
        fileUrl: "", // Will be updated after upload to storage
        fileSize: file.size,
        mimeType: file.type,
        analysisStatus: "pending",
        uploadedAt: new Date(),
      },
    });

    console.log(`[Upload API] Upload record created: ${upload.id}`);

    // Upload file to Google Cloud Storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageFileName = `uploads/${upload.id}/${timestamp}-${sanitizedName}`;
    
    try {
      const fileUrl = await uploadFileToStorage(storageFileName, buffer, file.type);
      
      // Update upload record with storage URL
      await db.upload.update({
        where: { id: upload.id },
        data: { fileUrl }
      });

      console.log(`[Upload API] File uploaded to storage: ${fileUrl}`);
    } catch (storageError) {
      console.error('[Upload API] Storage upload failed:', storageError);
      
      // Mark upload as failed
      await db.upload.update({
        where: { id: upload.id },
        data: {
          analysisStatus: 'failed',
          errorMessage: 'Failed to upload file to storage'
        }
      });

      return NextResponse.json(
        { success: false, error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // ============================================
    // === TRIGGERING ANALYSIS ===
    // ============================================
    console.log('='.repeat(60));
    console.log('=== TRIGGERING ANALYSIS ===');
    console.log('Upload ID:', upload.id);
    console.log('File Size:', buffer.length, 'bytes');
    console.log('Method: Buffer processing (serverless compatible)');
    console.log('='.repeat(60));

    // Start analysis in background (don't await - let it run async)
    analyzeUploadBuffer(upload.id, buffer).catch(async (error) => {
      console.error('='.repeat(60));
      console.error('=== ANALYSIS FAILED ===');
      console.error('Upload ID:', upload.id);
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('='.repeat(60));

      // Try to update database with failed status
      try {
        await db.upload.update({
          where: { id: upload.id },
          data: {
            analysisStatus: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Analysis failed: Unknown error',
          },
        });
        console.log('[Upload API] Database updated with failed status');
      } catch (updateError) {
        console.error('[Upload API] Failed to update database with error status:', updateError);
      }
    });

    console.log('[Upload API] Analysis started in background');
    console.log('[Upload API] Returning response to client immediately');

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