'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, CheckCircle, XCircle, RefreshCw, FileText,
  BookOpen, GraduationCap, MessageSquare, ArrowLeft, Clock, AlertCircle
} from 'lucide-react'

interface Upload {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  analysisStatus: string
  subject: string | null
  grade: number | null
  teacherComment: string | null
  extractedText: string | null
  errorMessage: string | null
  uploadedAt: string
  processedAt: string | null
  child: {
    name: string
    grade: number
    schoolType: string
  }
}

export default function UploadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const uploadId = params?.id as string

  const [upload, setUpload] = useState<Upload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  const fetchUpload = async () => {
    try {
      const response = await fetch(`/api/uploads/${uploadId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch upload')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch upload')
      }

      setUpload(data.upload)
      setError(null)
    } catch (err) {
      console.error('Error fetching upload:', err)
      setError(err instanceof Error ? err.message : 'Failed to load upload')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (uploadId) {
      fetchUpload()
    }
  }, [uploadId])

  // Auto-refresh every 2 seconds if status is pending or processing
  useEffect(() => {
    if (!upload) return

    if (upload.analysisStatus === 'pending' || upload.analysisStatus === 'processing') {
      const interval = setInterval(() => {
        console.log('[Upload Page] Auto-refreshing upload status...')
        fetchUpload()
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [upload])

  const handleRetry = async () => {
    if (!uploadId) return

    setRetrying(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger analysis')
      }

      // Refresh the upload data
      await fetchUpload()
    } catch (err) {
      console.error('Error retrying analysis:', err)
      setError(err instanceof Error ? err.message : 'Failed to retry analysis')
    } finally {
      setRetrying(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading upload details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 text-center mb-2">Error</h2>
          <p className="text-red-700 text-center mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!upload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <p className="text-gray-600">Upload not found</p>
      </div>
    )
  }

  const StatusBadge = () => {
    switch (upload.analysisStatus) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
            <CheckCircle className="h-4 w-4" />
            Completed
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
            <AlertCircle className="h-4 w-4" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
            Unknown
          </span>
        )
    }
  }

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

        {/* Progress Indicator for pending/processing */}
        {(upload.analysisStatus === 'pending' || upload.analysisStatus === 'processing') && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                {upload.analysisStatus === 'pending'
                  ? 'Waiting to start analysis...'
                  : 'Analyzing document... This page will refresh automatically.'}
              </p>
            </div>
          </div>
        )}

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
          </dl>
        </div>

        {/* Error Message with Retry Button */}
        {upload.analysisStatus === 'failed' && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Analysis Failed
                </h3>
                <p className="text-red-700">
                  {upload.errorMessage || 'An error occurred while analyzing the test.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center justify-center gap-2 font-semibold"
            >
              {retrying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </>
              )}
            </button>
          </div>
        )}

        {/* Extracted Data - Only show if completed */}
        {upload.analysisStatus === 'completed' && (
          <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Extracted Data
            </h2>

            <div className="space-y-4">
              {/* Subject */}
              {upload.subject && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Subject</p>
                    <p className="text-lg text-blue-900 font-semibold">{upload.subject}</p>
                  </div>
                </div>
              )}

              {/* Grade */}
              {upload.grade !== null && (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Grade</p>
                    <p className="text-lg text-green-900 font-semibold">{upload.grade.toFixed(1)}</p>
                  </div>
                </div>
              )}

              {/* Teacher Comment */}
              {upload.teacherComment && (
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Teacher Comment</p>
                    <p className="text-gray-900 mt-1">{upload.teacherComment}</p>
                  </div>
                </div>
              )}

              {/* Extracted Text */}
              {upload.extractedText && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium mb-2">Full Extracted Text</p>
                    <div className="max-h-64 overflow-y-auto bg-white p-3 rounded border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{upload.extractedText}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/upload"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Upload Another Test
          </Link>
        </div>
      </div>
    </div>
  )
}
