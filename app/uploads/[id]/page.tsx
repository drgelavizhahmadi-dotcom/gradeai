import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { db } from "@/lib/db";

interface UploadPageProps {
  params: Promise<{
    id: string;
  }>;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default async function UploadPage({ params }: UploadPageProps) {
  const { id } = await params;

  // Fetch upload from database
  const upload = await db.upload.findUnique({
    where: { id },
    include: {
      child: {
        select: {
          name: true,
          grade: true,
          schoolType: true,
        },
      },
    },
  });

  // Return 404 if upload not found
  if (!upload) {
    notFound();
  }

  // Status badge component
  const StatusBadge = () => {
    switch (upload.analysisStatus) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckCircle className="h-4 w-4" />
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            <AlertCircle className="h-4 w-4" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
            Unknown
          </span>
        );
    }
  };

  // Status message component
  const StatusMessage = () => {
    switch (upload.analysisStatus) {
      case "pending":
        return (
          <div className="rounded-lg bg-yellow-50 p-6 text-center">
            <Clock className="mx-auto mb-3 h-12 w-12 text-yellow-600" />
            <h3 className="mb-2 text-lg font-semibold text-yellow-900">
              Waiting to Process
            </h3>
            <p className="text-yellow-800">
              Your test has been uploaded successfully and is waiting to be analyzed.
            </p>
          </div>
        );
      case "processing":
        return (
          <div className="rounded-lg bg-blue-50 p-6 text-center">
            <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin text-blue-600" />
            <h3 className="mb-2 text-lg font-semibold text-blue-900">
              Analyzing...
            </h3>
            <p className="text-blue-800">
              Our AI is analyzing the test. This usually takes 1-2 minutes.
            </p>
          </div>
        );
      case "failed":
        return (
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-600" />
            <h3 className="mb-2 text-lg font-semibold text-red-900">
              Analysis Failed
            </h3>
            <p className="mb-4 text-red-800">
              {upload.errorMessage || "An error occurred while analyzing the test."}
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Try Again
            </Link>
          </div>
        );
      case "completed":
        return (
          <div className="rounded-lg bg-green-50 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-600" />
            <h3 className="mb-2 text-lg font-semibold text-green-900">
              Analysis Complete
            </h3>
            <p className="text-green-800">
              Full analysis results will be displayed here in Week 3.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Test Upload
            </h1>
            <StatusBadge />
          </div>
          <p className="text-lg text-gray-600">
            View details and analysis for this test
          </p>
        </div>

        {/* Upload Details Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Upload Details
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600">Student:</dt>
              <dd className="text-gray-900">{upload.child.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600">Grade:</dt>
              <dd className="text-gray-900">
                {upload.child.grade} • {upload.child.schoolType}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600">File Name:</dt>
              <dd className="truncate text-gray-900">{upload.fileName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600">File Size:</dt>
              <dd className="text-gray-900">{formatFileSize(upload.fileSize)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600">Uploaded:</dt>
              <dd className="text-gray-900">{formatDate(upload.uploadedAt)}</dd>
            </div>
            {upload.processedAt && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600">Processed:</dt>
                <dd className="text-gray-900">{formatDate(upload.processedAt)}</dd>
              </div>
            )}
            {upload.subject && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600">Subject:</dt>
                <dd className="text-gray-900">{upload.subject}</dd>
              </div>
            )}
            {upload.grade !== null && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600">Grade:</dt>
                <dd className="text-gray-900">{upload.grade}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Status Message */}
        <StatusMessage />

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/upload"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Upload Another Test
          </Link>
        </div>
      </div>
    </div>
  );
}
