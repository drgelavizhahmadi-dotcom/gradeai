"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Upload, X, FileImage, FileText, Loader2, AlertCircle, Plus, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { z } from "zod";
import * as pdfjsLib from "pdfjs-dist";

interface UploadZoneProps {
  childId: string;
}

interface UploadResponse {
  success: boolean;
  uploadId: string;
  images?: { base64: string; mimeType: string; pageNumber: number }[];
  isDuplicate?: boolean;
  message?: string;
  error?: string;
}

type ProcessingStep = "idle" | "uploading" | "extracting" | "analyzing" | "complete" | "error";

const fileSchema = z.object({
  size: z.number().max(4718592, "Datei muss kleiner als 4,5 MB sein"),
  type: z.enum(["image/jpeg", "image/png", "application/pdf"], {
    message: "Nur JPG, PNG und PDF Dateien sind erlaubt"
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
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { language } = useLanguage();

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
          setError(`PDF-Konvertierung fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
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

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      setError(`Gesamtgr\u00f6\u00dfe (${(totalSize / 1024 / 1024).toFixed(1)} MB) \u00fcberschreitet das 50-MB-Limit. Bitte reduzieren Sie die Bildqualit\u00e4t oder Seitenzahl.`);
      return;
    }

    setIsUploading(true);
    setProcessingStep("uploading");
    setError(null);

    try {
      // === STEP 1: Upload files ===
      console.log(`[UploadZone] Step 1: Uploading ${files.length} file(s)`);

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("childId", childId);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const contentType = uploadRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await uploadRes.text();
        throw new Error(
          text.includes("Request Entity Too Large") || text.includes("413")
            ? "Dateien sind zu gro\u00df. Vercel Free Tier erlaubt max. 4 MB."
            : "Serverfehler. Bitte versuchen Sie es sp\u00e4ter erneut."
        );
      }

      const uploadData: UploadResponse = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || "Upload fehlgeschlagen");
      }

      const { uploadId, images } = uploadData;
      if (!images || images.length === 0) {
        throw new Error("Keine Bilder vom Upload erhalten");
      }

      console.log(`[UploadZone] Step 1 complete: uploadId=${uploadId}, ${images.length} images`);

      // === STEP 2: Extract (Layer 1 - Vision) ===
      setProcessingStep("extracting");
      console.log("[UploadZone] Step 2: Extracting text from images...");

      const extractRes = await fetch("/api/analyze/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, images, language }),
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok || !extractData.success) {
        throw new Error(extractData.error || "Textextraktion fehlgeschlagen");
      }

      console.log(`[UploadZone] Step 2 complete: ${extractData.extractionLength} chars extracted`);

      // === STEP 3: Generate Report (Layer 2 - AI Analysis) ===
      setProcessingStep("analyzing");
      console.log("[UploadZone] Step 3: Generating report...");

      const reportRes = await fetch("/api/analyze/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });

      const reportData = await reportRes.json();
      if (!reportRes.ok || !reportData.success) {
        throw new Error(reportData.error || "Berichterstellung fehlgeschlagen");
      }

      console.log(`[UploadZone] Step 3 complete: grade=${reportData.grade}`);

      // === Done ===
      setProcessingStep("complete");
      previews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });

      router.push(`/uploads/${uploadId}`);
    } catch (err) {
      console.error("[UploadZone] Error:", err);
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
      setProcessingStep("error");
      setIsUploading(false);
    }
  };

  const processingSteps = [
    { step: "uploading" as const, label: "Dateien hochladen" },
    { step: "extracting" as const, label: "Text extrahieren (KI-Vision)" },
    { step: "analyzing" as const, label: "Bericht erstellen (KI-Analyse)" },
    { step: "complete" as const, label: "Fertig!" },
  ];

  return (
    <div className="w-full">
      {/* Error Message */}
      {error && (
        <div className="mb-6 card-story p-4 border-2 border-[var(--coral)]/30 bg-[var(--coral)]/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[var(--coral)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[var(--coral)] mb-1">
                Fehler
              </p>
              <p className="text-sm text-[var(--gray-700)]">{error}</p>
            </div>
          </div>
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
            card-story cursor-pointer border-2 border-dashed p-10 md:p-14 text-center transition-all
            ${
              isDragging
                ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-lg scale-[1.01]"
                : "border-[var(--gray-300)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/50 hover:shadow-md"
            }
          `}
        >
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${isDragging ? 'bg-[var(--primary)]/20' : 'bg-[var(--primary-soft)]'}`}>
            <Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-[var(--primary)]' : 'text-[var(--primary)]/70'}`} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
            Testseiten hochladen
          </h3>
          <p className="mb-4 text-[var(--gray-600)]">
            Laden Sie alle Seiten eines Tests zusammen hoch &ndash; per Drag &amp; Drop oder Klick
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-[var(--gray-500)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gray-100)] px-3 py-1">
              <FileImage className="h-3 w-3" /> JPG, PNG
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gray-100)] px-3 py-1">
              <FileText className="h-3 w-3" /> PDF
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gray-100)] px-3 py-1">
              Max. 4,5 MB pro Datei
            </span>
          </div>
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
        <div className="card-story p-6 space-y-4">
          {/* File List */}
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-[var(--primary-soft)]/50 rounded-xl border border-[var(--gray-200)]">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt="Vorschau"
                      className="h-16 w-16 rounded-xl object-cover border border-[var(--gray-200)]"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--coral)]/10 border border-[var(--coral)]/20">
                      <FileText className="h-7 w-7 text-[var(--coral)]" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="text-sm font-semibold text-[var(--gray-800)] truncate">
                    {file.name}
                  </h4>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="flex-shrink-0 rounded-lg p-1.5 text-[var(--gray-400)] transition-colors hover:bg-[var(--coral)]/10 hover:text-[var(--coral)] disabled:opacity-50"
                  aria-label="Datei entfernen"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          {!isUploading && !isConverting && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--gray-300)] bg-[var(--primary-soft)]/30 px-4 py-3 text-sm font-medium text-[var(--primary)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
            >
              <Plus className="h-4 w-4" />
              Weitere Seiten hinzuf&uuml;gen
            </button>
          )}

          {/* Converting indicator */}
          {isConverting && (
            <div className="flex items-center justify-center gap-2 text-[var(--primary)] py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">PDF wird konvertiert...</span>
            </div>
          )}

          {/* Processing Steps Indicator */}
          {processingStep !== "idle" && processingStep !== "error" && (
            <div className="rounded-xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--lavender)]/20 p-5 border border-[var(--primary)]/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                  KI-Analyse l&auml;uft
                </span>
              </div>
              <div className="space-y-3">
                {processingSteps.map(({ step, label }) => {
                  const isActive = processingStep === step;
                  const isDone =
                    (step === "uploading" && ["extracting", "analyzing", "complete"].includes(processingStep)) ||
                    (step === "extracting" && ["analyzing", "complete"].includes(processingStep)) ||
                    (step === "analyzing" && processingStep === "complete");
                  return (
                    <div key={step} className={`flex items-center gap-3 text-sm transition-all ${isActive ? "text-[var(--primary)] font-semibold" : isDone ? "text-[var(--sage)]" : "text-[var(--gray-400)]"}`}>
                      {isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                      ) : isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--sage)]" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || isConverting}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-lg font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {processingStep === "uploading" && "Hochladen..."}
                {processingStep === "extracting" && "Text wird extrahiert..."}
                {processingStep === "analyzing" && "Bericht wird erstellt..."}
                {processingStep === "complete" && "Fertig!"}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {files.length === 1 ? '1 Seite analysieren' : `${files.length} Seiten analysieren`}
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileInputChange}
            multiple
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
