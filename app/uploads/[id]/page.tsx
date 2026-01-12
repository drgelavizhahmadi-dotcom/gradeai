'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, CheckCircle, XCircle, RefreshCw, FileText,
  BookOpen, GraduationCap, ArrowLeft, Clock, AlertCircle, Download, Info
} from 'lucide-react'
import AnalysisDisplay from '@/components/AnalysisDisplay'
import { TestAnalysis } from '@/lib/ai/prompts'

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
  analysis: {
    ai: TestAnalysis | null
    aiError: string | null
  } | null
  child: {
    name: string
    grade: number
    schoolType: string
  }
}

export default function UploadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const uploadId = params?.id as string

  const [upload, setUpload] = useState<Upload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)

  // Check for duplicate detection message
  const isDuplicate = searchParams.get('duplicate') === 'true'
  const duplicateMessage = searchParams.get('message') || 'This test was already uploaded. Showing existing analysis.'
  const [showDuplicateMessage, setShowDuplicateMessage] = useState(isDuplicate)

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

      console.log('[Upload Page] Fetched upload data:', data.upload)
      console.log('[Upload Page] Analysis status:', data.upload.analysisStatus)
      console.log('[Upload Page] Analysis data:', data.upload.analysis)
      console.log('[Upload Page] AI analysis:', data.upload.analysis?.ai)

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
    // Using toLocaleString() for local timezone display
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
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

        {/* Duplicate Detection Message */}
        {showDuplicateMessage && (
          <div className="mb-6 rounded-xl bg-blue-50 border-2 border-blue-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Duplicate Upload Detected
                </h3>
                <p className="text-sm text-blue-800">
                  {duplicateMessage}
                </p>
              </div>
              <button
                onClick={() => setShowDuplicateMessage(false)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                aria-label="Dismiss message"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

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

        {/* Test Overview - Only show if completed */}
        {upload.analysisStatus === 'completed' && (
          <>
            {/* Quick Summary Card */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {upload.subject && (
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-600">Subject</p>
                  </div>
                  <p className="text-xl font-bold text-blue-900">{upload.subject}</p>
                </div>
              )}

              {upload.grade !== null && (
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-600">Grade Received</p>
                  </div>
                  <p className="text-xl font-bold text-green-900">{upload.grade.toFixed(1)}</p>
                </div>
              )}

              <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <p className="text-sm font-medium text-purple-600">Uploaded</p>
                </div>
                <p className="text-sm font-semibold text-purple-900">
                  {formatDate(upload.uploadedAt)}
                </p>
              </div>
            </div>

            {/* AI Analysis Display */}
            {(() => {
              console.log('[Upload Page] Checking AI analysis render condition')
              console.log('[Upload Page] upload.analysis exists?', !!upload.analysis)
              console.log('[Upload Page] upload.analysis?.ai exists?', !!upload.analysis?.ai)
              console.log('[Upload Page] upload.analysis?.ai type:', typeof upload.analysis?.ai)
              if (upload.analysis?.ai) {
                console.log('[Upload Page] AI analysis structure:', Object.keys(upload.analysis.ai))
              }
              return null
            })()}
            {upload.analysis?.ai && (
              <div className="mb-6">
                <AnalysisDisplay analysis={upload.analysis.ai} />
              </div>
            )}

            {/* Show AI Error if present but analysis still completed */}
            {upload.analysis?.aiError && !upload.analysis?.ai && (
              <div className="mb-6 rounded-xl border-2 border-yellow-200 bg-yellow-50 p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                      AI Analysis Unavailable
                    </h3>
                    <p className="text-yellow-800 mb-3">
                      The text was extracted successfully, but AI analysis could not be completed.
                    </p>
                    <p className="text-sm text-yellow-700">
                      Error: {upload.analysis.aiError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Raw Extracted Text - Collapsible */}
            {upload.extractedText && (
              <details className="mb-6 rounded-xl bg-white p-6 shadow-md">
                <summary className="cursor-pointer font-semibold text-gray-900 flex items-center gap-2 hover:text-blue-600">
                  <FileText className="h-5 w-5" />
                  View Raw Extracted Text
                </summary>
                <div className="mt-4 max-h-96 overflow-y-auto rounded border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {upload.extractedText}
                  </p>
                </div>
              </details>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Upload Another Test
          </Link>
          {upload.analysisStatus === 'completed' && upload.analysis?.ai && (
            <button
              onClick={() => {
                // TODO: Implement PDF report download
                alert('Report download feature coming soon!')
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Download className="h-5 w-5" />
              Download Report
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
