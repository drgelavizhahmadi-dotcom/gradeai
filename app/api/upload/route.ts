import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { analyzeUploadBuffer } from "@/lib/analysis";
import { uploadFileToStorage } from "@/lib/storage";

// Route segment config for increased body size limit
export const runtime = 'nodejs'; // Use Node.js runtime for better file handling
export const maxDuration = 60; // Maximum execution time in seconds

// Increase body size limit for file uploads (Vercel limit is 4.5MB by default)
export const dynamic = 'force-dynamic';
// Note: Body parser size limit is controlled by Vercel config
// Add to vercel.json: { "functions": { "api/upload/route.ts": { "maxDuration": 60 } } }

// Validation schema for file uploads
const uploadSchema = z.object({
  childId: z.string().min(1, "Child ID is required"),
});

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];
// Note: PDFs are disabled due to Vision API limitations. Users should convert to JPG/PNG.
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB per file (Vercel free tier limit is 4.5MB)
const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4MB total (Vercel constraint)

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()
    const authenticatedUserId = session.user.id

    console.log(`[Upload API] Authenticated user: ${authenticatedUserId}`)

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const childId = formData.get("childId") as string | null;

    // Validate required fields
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    if (!childId) {
      return NextResponse.json(
        { success: false, error: "Child ID is required" },
        { status: 400 }
      );
    }

    console.log(`[Upload API] Received ${files.length} file(s) for one test`)

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

    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    // Validate total size
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Total file size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds 4MB limit (Vercel free tier). Please compress or upgrade to Pro.`,
        },
        { status: 400 }
      );
    }

    // Validate all files
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid file type for ${file.name}. Only JPG and PNG images are supported. Please convert PDFs to images first.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File ${file.name} exceeds 4MB limit (Vercel constraint). Please compress the file or upgrade to Pro.`,
          },
          { status: 400 }
        );
      }
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

    // ===== MULTI-FILE UPLOAD FOR ONE TEST =====
    // Convert all files to buffers and upload to storage
    const fileBuffers: Buffer[] = [];
    const uploadedFileUrls: string[] = [];

    // Create a single Upload record for all pages of this test
    const fileName = files.length === 1 
      ? files[0].name 
      : `${files[0].name.split('.')[0]}_${files.length}_pages`;

    const upload = await db.upload.create({
      data: {
        userId: child.userId,
        childId: childId,
        fileName: fileName,
        fileUrl: "", // Will be updated with first file URL
        fileSize: totalSize,
        mimeType: files[0].type,
        analysisStatus: "pending",
        uploadedAt: new Date(),
      },
    });

    console.log(`[Upload API] Upload record created: ${upload.id} for ${files.length} file(s)`);

    // Upload all files to storage and collect buffers
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fileBuffers.push(buffer);

        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storageFileName = `uploads/${upload.id}/page_${i + 1}_${timestamp}-${sanitizedName}`;
        
        const fileUrl = await uploadFileToStorage(storageFileName, buffer, file.type);
        uploadedFileUrls.push(fileUrl);
        console.log(`[Upload API] File ${i + 1}/${files.length} uploaded: ${fileUrl}`);
      }

      // Update upload record with first file URL (for reference)
      await db.upload.update({
        where: { id: upload.id },
        data: { fileUrl: uploadedFileUrls[0] }
      });

      console.log(`[Upload API] All ${files.length} files uploaded successfully`);
    } catch (storageError) {
      console.error('[Upload API] Storage upload failed:', storageError);
      
      await db.upload.update({
        where: { id: upload.id },
        data: {
          analysisStatus: 'failed',
          errorMessage: 'Failed to upload files to storage'
        }
      });

      return NextResponse.json(
        { success: false, error: "Failed to upload files to storage" },
        { status: 500 }
      );
    }

    // ============================================
    // === TRIGGERING ANALYSIS ===
    // ============================================
    console.log('='.repeat(60));
    console.log('=== TRIGGERING ANALYSIS ===');
    console.log('Upload ID:', upload.id);
    console.log('Total Files:', files.length);
    console.log('Total Size:', totalSize, 'bytes');
    console.log('Method: Multi-buffer processing (serverless compatible)');
    console.log('='.repeat(60));

    // Start analysis in background with ALL file buffers (combined OCR)
    analyzeUploadBuffer(upload.id, fileBuffers).catch(async (error) => {
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

    console.log(`[Upload API] Analysis started in background for ${files.length} file(s)`);
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