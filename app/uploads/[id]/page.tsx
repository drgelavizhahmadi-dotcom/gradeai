'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import jsPDF from 'jspdf'
import {
  Loader2, CheckCircle, XCircle, RefreshCw, FileText,
  BookOpen, GraduationCap, ArrowLeft, Clock, AlertCircle, Download, Info, Trash2
} from 'lucide-react'
import GradeAIParentReport from '@/components/GradeAIParentReport/index'
import { TestAnalysis } from '@/lib/ai/prompts'
import { transformToReportFormat } from '@/lib/ai/transformToReportFormat'
import ErrorBoundary from '@/components/ErrorBoundary'

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
  childId: string
  analysis: {
    ai: TestAnalysis | null
    aiError: string | null
  } | null
  child: {
    id?: string
    name: string
    grade: number
    schoolType: string
  }
}

export default function UploadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const uploadId = params.id as string

  const [upload, setUpload] = useState<Upload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
    console.log('Fetching upload details for ID:', uploadId)
    fetch(`/api/uploads/${uploadId}`)
      .then((res) => {
        if (!res.ok) {
          console.error('Error fetching upload details:', res.status, res.statusText)
          setError('Failed to fetch upload details')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.success) {
          setUpload(data.upload)
        } else {
          console.error('API returned error:', data?.error)
          setError(data?.error || 'Unknown error')
        }
      })
      .catch((err) => {
        console.error('Unexpected error fetching upload details:', err)
        setError('Unexpected error occurred')
      })
      .finally(() => setLoading(false))
  }, [uploadId])

  // Auto-refresh every 2 seconds if status is pending or processing
  useEffect(() => {
    if (!upload) return
    
    const status = upload.analysisStatus
    if (status === 'pending' || status === 'processing') {
      console.log(`[Upload Page] Starting auto-refresh for ${status} status`)
      const interval = setInterval(() => {
        console.log('[Upload Page] Auto-refreshing upload status...')
        fetchUpload()
      }, 2000)

      return () => {
        console.log('[Upload Page] Clearing auto-refresh interval')
        clearInterval(interval)
      }
    }
  }, [upload?.analysisStatus]) // Only depend on status, not entire upload object

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

  const handleDelete = async () => {
    if (!uploadId) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/uploads/${uploadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete upload')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete upload')
      }

      // Redirect to child profile or dashboard
      if (upload?.childId) {
        router.push(`/dashboard/children/${upload.childId}`)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Error deleting upload:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete upload')
      setDeleting(false)
      setShowDeleteConfirm(false)
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

  const generatePDF = (analysis: any, childName: string, subject: string) => {
    const doc = new jsPDF()
    const summary = analysis?.summary || {}
    const meta = analysis?.metadata || {}
    const ev = meta?.visualEvidence || {}
    const strengths: string[] = analysis?.strengths || []
    const weaknesses: string[] = analysis?.weaknesses || []
    const recs: any[] = analysis?.recommendations || []

    let y = 20
    const lineHeight = 7
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(`Elternbericht - ${subject || 'Unbekanntes Fach'}`, margin, y)
    y += 10

    // Student name
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Schuler/in: ${childName}`, margin, y)
    y += lineHeight

    // Grade
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Gesamtnote: ${summary.overallGrade || '-'} (${Math.round((summary.percentage || 0))}%)`, margin, y)
    y += lineHeight + 3

    // Confidence
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`KI-Vertrauen: ${Math.round(((summary.confidence || 0.85) * 100))}% | OCR: ${Math.round(((meta.ocrConfidence || 0.85) * 100))}%`, margin, y)
    y += lineHeight + 5

    // Visual Evidence
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Visuelle Evidenz:', margin, y)
    y += lineHeight
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Erkannte Note: ${ev.grade_detected ?? '—'}`, margin + 5, y)
    y += lineHeight
    doc.text(`Punkte: ${ev.points ?? '—'}`, margin + 5, y)
    y += lineHeight
    doc.text(`Korrekturdichte: ${ev.correction_density != null ? Math.round(ev.correction_density * 100) + '%' : '—'}`, margin + 5, y)
    y += lineHeight
    if (ev.teacher_comment) {
      const commentLines = doc.splitTextToSize(`Lehrkraft-Kommentar: ${ev.teacher_comment}`, maxWidth - 5)
      doc.text(commentLines, margin + 5, y)
      y += commentLines.length * lineHeight
    }
    y += 5

    // Strengths
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Starken:', margin, y)
    y += lineHeight
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    strengths.slice(0, 6).forEach(s => {
      const lines = doc.splitTextToSize(`• ${s}`, maxWidth - 5)
      if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage()
        y = 20
      }
      doc.text(lines, margin + 5, y)
      y += lines.length * lineHeight
    })
    y += 5

    // Weaknesses
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Verbesserungsfelder:', margin, y)
    y += lineHeight
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    weaknesses.slice(0, 6).forEach(w => {
      const lines = doc.splitTextToSize(`• ${w}`, maxWidth - 5)
      if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage()
        y = 20
      }
      doc.text(lines, margin + 5, y)
      y += lines.length * lineHeight
    })
    y += 5

    // Recommendations
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Empfehlungen:', margin, y)
    y += lineHeight
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    recs.slice(0, 8).forEach(r => {
      const text = `• ${r.action || ''}${r.timeframe ? ' (' + r.timeframe + ')' : ''}`
      const lines = doc.splitTextToSize(text, maxWidth - 5)
      if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage()
        y = 20
      }
      doc.text(lines, margin + 5, y)
      y += lines.length * lineHeight
    })
    y += 5

    // Executive Summary
    if (summary.executiveSummary) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Zusammenfassung:', margin, y)
      y += lineHeight
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const summaryLines = doc.splitTextToSize(summary.executiveSummary, maxWidth)
      doc.text(summaryLines, margin, y)
    }

    return doc
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
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Test?</h2>
            </div>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this test? This action cannot be undone and will permanently remove the test and its analysis.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-red-400 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

            {/* GradeAI Parent Report - Multilingual AI-Powered Report */}
            {upload.analysis?.ai && (
              <div className="mb-6">
                {(() => {
                  console.log('[Uploads Page] Rendering GradeAIParentReport with data:', upload.analysis.ai)
                  const transformedData = transformToReportFormat(upload.analysis.ai)
                  console.log('[Uploads Page] Transformed data:', transformedData)
                  return (
                    <ErrorBoundary
                      fallback={
                        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-lg font-semibold text-red-900 mb-2">
                                Report Display Error
                              </h3>
                              <p className="text-red-800 mb-3">
                                The analysis completed successfully, but there was an error displaying the report.
                              </p>
                              <p className="text-sm text-red-700">
                                Raw analysis data is available below. Please try refreshing the page or contact support if the issue persists.
                              </p>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <GradeAIParentReport
                        analysisData={transformedData}
                      />
                    </ErrorBoundary>
                  )
                })()}
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
            href="/uploads"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Upload Another Test
          </Link>
          {upload.analysisStatus === 'completed' && upload.analysis?.ai && (
            <button
              onClick={() => {
                const ai = upload.analysis?.ai
                if (!ai) return
                const filename = `${upload.child.name || 'Kind'}-${upload.subject || 'Test'}.pdf`
                const pdf = generatePDF(ai, upload.child.name, upload.subject || 'Test')
                pdf.save(filename)
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Download className="h-5 w-5" />
              Download PDF Report
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Trash2 className="h-5 w-5" />
            Delete Test
          </button>
        </div>
      </div>
    </div>
  )
}
