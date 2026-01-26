"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, FileImage, FileText, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import * as pdfjsLib from "pdfjs-dist";

interface UploadZoneProps {
  childId: string;
}

interface UploadResponse {
  success: boolean;
  uploadId: string;
  isDuplicate?: boolean;
  message?: string;
  error?: string;
}

const fileSchema = z.object({
  size: z.number().max(4718592, "File must be less than 4.5MB"),
  type: z.enum(["image/jpeg", "image/png", "application/pdf"], {
    message: "Only JPG, PNG, and PDF files are allowed"
  }),
});

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

export default function UploadZone({ childId }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Configure PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    
    // Clean up preview URLs on unmount
    return () => {
      previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []); // Empty deps - only run once on mount/unmount

  const validateFile = (selectedFile: File): boolean => {
    setError(null);

    try {
      fileSchema.parse({
        size: selectedFile.size,
        type: selectedFile.type,
      });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      }
      return false;
    }
  };

  // Convert PDF to images with optimized quality
  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    console.log('[PDF Convert] Starting conversion of:', pdfFile.name);
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const imageFiles: File[] = [];

    console.log(`[PDF Convert] PDF has ${pdf.numPages} page(s)`);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`[PDF Convert] Processing page ${pageNum}/${pdf.numPages}`);
      const page = await pdf.getPage(pageNum);
      
      // Use moderate scale for good quality without huge file size (2.0 = ~150 DPI)
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: false })!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      console.log(`[PDF Convert] Canvas size: ${canvas.width}x${canvas.height}`);

      // Fill with white background first
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport,
        background: 'white'
      } as any).promise;

      // Convert canvas to blob with moderate quality to reduce file size
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          }, 
          'image/jpeg', 
          0.85 // Good quality but smaller files
        );
      });

      console.log(`[PDF Convert] Page ${pageNum} converted: ${(blob.size / 1024).toFixed(1)}KB`);

      // Validate the blob isn't empty
      if (blob.size < 1000) {
        throw new Error(`Page ${pageNum} produced suspiciously small image (${blob.size} bytes)`);
      }

      // Create File from blob
      const fileName = pdfFile.name.replace('.pdf', `_page${pageNum}.jpg`);
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
      imageFiles.push(imageFile);
      
      console.log(`[PDF Convert] Added file: ${fileName}`);
    }

    console.log(`[PDF Convert] ✓ Conversion complete: ${imageFiles.length} image(s)`);
    return imageFiles;
  };

  const handleFileSelect = async (selectedFiles: File[]) => {
    setIsConverting(true);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const selectedFile of selectedFiles) {
      if (!validateFile(selectedFile)) {
        continue;
      }

      // Convert PDF to images
      if (selectedFile.type === 'application/pdf') {
        try {
          const imageFiles = await convertPdfToImages(selectedFile);
          for (const imageFile of imageFiles) {
            validFiles.push(imageFile);
            const previewUrl = URL.createObjectURL(imageFile);
            newPreviews.push(previewUrl);
          }
        } catch (err) {
          setError(`Failed to convert PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsConverting(false);
          return;
        }
      } else {
        validFiles.push(selectedFile);
        
        // Generate preview for images
        if (selectedFile.type.startsWith("image/")) {
          const previewUrl = URL.createObjectURL(selectedFile);
          newPreviews.push(previewUrl);
        } else {
          newPreviews.push('');
        }
      }
    }

    setFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    setIsConverting(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const preview = prev[index];
      if (preview) URL.revokeObjectURL(preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(Array.from(selectedFiles));
    }
  };



  const handleUpload = async () => {
    if (files.length === 0) return;

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      setError(`Total file size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds 50MB limit. Please reduce image quality or number of pages.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log(`[UploadZone] Uploading ${files.length} file(s) as ONE test`);

      const formData = new FormData();

      // Add all files with the key "files"
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("childId", childId);

      // Use AbortController for timeout (65 seconds - slightly more than Vercel's 60s limit)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 65000);

      let response: Response;
      try {
        response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Upload timed out. The server is taking too long. Please try with a smaller or clearer image.');
        }
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[UploadZone] Non-JSON response:", text);
        throw new Error(
          text.includes("Request Entity Too Large") || text.includes("413")
            ? "Files are too large. Vercel free tier allows max 4MB. Please compress your file or upgrade to Pro."
            : "Server error. Please try again later."
        );
      }

      const data: UploadResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Clean up previews
      previews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });

      // Always redirect to the single upload result page
      console.log(`[UploadZone] Upload successful, redirecting to /uploads/${data.uploadId}`);
      router.push(`/uploads/${data.uploadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Upload Zone or File Preview */}
      {files.length === 0 ? (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all
            ${
              isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
            }
          `}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Upload Test Pages
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Upload all pages of ONE test together (drag multiple files or click to browse)
          </p>
          <p className="text-xs text-gray-500">
            Accepts JPG, PNG, PDF • Max 4MB per file • PDFs auto-converted to images • All pages analyzed as one test
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileInputChange}
            multiple
            className="hidden"
          />
        </div>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-md space-y-4">
          {/* File List */}
          {files.map((file, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              {/* Preview */}
              <div className="flex-shrink-0">
                {previews[index] ? (
                  <img
                    src={previews[index]}
                    alt="Preview"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-red-50">
                    <FileText className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 truncate">
                  {file.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFile(index)}
                disabled={isUploading}
                className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50"
                aria-label="Remove file"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}

          {/* Add More Button */}
          {!isUploading && !isConverting && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100"
            >
              <Upload className="h-4 w-4" />
              Add More Pages
            </button>
          )}

          {/* Converting indicator */}
          {isConverting && (
            <div className="flex items-center justify-center gap-2 text-blue-600 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Converting PDF to images...</span>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || isConverting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading {files.length} {files.length === 1 ? 'page' : 'pages'}...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Analyze {files.length} {files.length === 1 ? 'page' : 'pages'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
