"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, FileImage, FileText, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";

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
  size: z.number().max(10485760, "File must be less than 10MB"),
  type: z.enum(["image/jpeg", "image/png", "application/pdf"], {
    message: "Only JPG, PNG, and PDF files are allowed"
  }),
});

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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [previews]);

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

  const handleFileSelect = (selectedFiles: File[]) => {
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const selectedFile of selectedFiles) {
      if (!validateFile(selectedFile)) {
        continue;
      }

      validFiles.push(selectedFile);

      // Generate preview for images
      if (selectedFile.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(selectedFile);
        newPreviews.push(previewUrl);
      } else {
        newPreviews.push('');
      }
    }

    setFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
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

    setIsUploading(true);
    setError(null);

    try {
      const uploadIds: string[] = [];

      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("childId", childId);

        console.log(`[UploadZone] Uploading file ${i + 1}/${files.length}: ${file.name}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // Response is not JSON - likely an error from server/proxy
          const text = await response.text();
          console.error("[UploadZone] Non-JSON response:", text);
          throw new Error(
            text.includes("Request Entity Too Large") || text.includes("413")
              ? "File is too large. Please use a smaller file (max 10MB)."
              : "Server error. Please try again later."
          );
        }

        const data: UploadResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Upload failed");
        }

        uploadIds.push(data.uploadId);
      }

      // Clean up previews
      previews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });

      // Redirect based on number of uploads
      if (uploadIds.length === 1) {
        router.push(`/uploads/${uploadIds[0]}`);
      } else {
        // Multiple uploads - redirect to dashboard/children page
        router.push(`/children/${childId}`);
      }
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
            Upload Test Images or PDFs
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Drag and drop your files here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Accepts JPG, PNG, PDF • Max 10MB per file • Multiple files supported
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
          {!isUploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100"
            >
              <Upload className="h-4 w-4" />
              Add More Files
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading {files.length} {files.length === 1 ? 'file' : 'files'}...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload {files.length} {files.length === 1 ? 'file' : 'files'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
