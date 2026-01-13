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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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

  const handleFileSelect = (selectedFile: File) => {
    if (!validateFile(selectedFile)) {
      return;
    }

    setFile(selectedFile);

    // Generate preview for images
    if (selectedFile.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
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

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("childId", childId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      // Clean up and redirect
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      // If this is a duplicate, we'll redirect with a query parameter to show the message
      if (data.isDuplicate && data.message) {
        console.log(`[UploadZone] Duplicate detected: ${data.message}`);
        router.push(`/uploads/${data.uploadId}?duplicate=true&message=${encodeURIComponent(data.message)}`);
      } else {
        router.push(`/uploads/${data.uploadId}`);
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
      {!file ? (
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
            Upload Test Image or PDF
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Accepts JPG, PNG, PDF • Max 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="flex-shrink-0">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-24 w-24 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-red-50">
                  <FileText className="h-10 w-10 text-red-600" />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-gray-900 truncate">
                {file.name}
              </h4>
              <p className="text-sm text-gray-600">
                {formatFileSize(file.size)}
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemoveFile}
              disabled={isUploading}
              className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Upload & Analyze
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
