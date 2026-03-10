'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, CheckCircle, XCircle, RefreshCw, FileText,
  BookOpen, GraduationCap, ArrowLeft, Clock, AlertCircle, Download, Info, Trash2,
  Sparkles, Calendar, User, Globe, ChevronDown
} from 'lucide-react'
import { OwlMascot } from '@/components/mascots'
import { GradeBadge } from '@/components/ui/GradeBadge'
import { SubjectTag } from '@/components/ui/SubjectTag'
import GradeAIParentReport from '@/components/GradeAIParentReport/index'
import { ParentReport } from '@/components/ParentReport'
import { TestAnalysis } from '@/lib/ai/prompts'
import { transformToReportFormat } from '@/lib/ai/transformToReportFormat'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Language } from '@/lib/translations'
import {
  FlashcardsPremiumSection,
  FairnessCheckPremiumSection,
  LearningMaterialPremiumSection,
  UpgradeModal
} from '@/components/PremiumFeatures'

// Supported languages for report translation (matches Language selector)
const REPORT_LANGUAGES: Record<Language, { name: string; native: string; flag: string }> = {
  de: { name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  en: { name: 'English', native: 'English', flag: '🇬🇧' },
  ar: { name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  fa: { name: 'Persian', native: 'فارسی', flag: '🇮🇷' },
  ku: { name: 'Kurdish (Sorani)', native: 'کوردی', flag: '🇮🇶' },
  kmr: { name: 'Kurdish (Kurmanji)', native: 'Kurmancî', flag: '🏳️' },
  tr: { name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  ro: { name: 'Romanian', native: 'Română', flag: '🇷🇴' },
  ru: { name: 'Russian', native: 'Русский', flag: '🇷🇺' },
}

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
  flashcards: any | null
  fairnessCheck: any | null
  learningMaterial: any | null
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


  // Global Language translation state
  const { language, t } = useLanguage()
  // Local Report translation state
  const [reportLanguage, setReportLanguage] = useState<Language>('de')
  const [translatedReport, setTranslatedReport] = useState<any>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)
  const [originalReport, setOriginalReport] = useState<any>(null)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  // Premium features state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<'flashcards' | 'fairness' | 'learning' | undefined>()

  // TODO: Get this from user session/subscription status
  const isPremiumUser = true // Set to true to test premium features

  const handleUpgrade = (feature?: 'flashcards' | 'fairness' | 'learning') => {
    setUpgradeFeature(feature)
    setShowUpgradeModal(true)
  }

  // Check for duplicate detection message
  const isDuplicate = searchParams.get('duplicate') === 'true'
  const duplicateMessage = searchParams.get('message') || (t.upload?.duplicateMessage || 'This test was already uploaded. Showing existing analysis.')
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
    fetch(`/api/uploads/${uploadId}`)
      .then((res) => {
        if (!res.ok) {
          setError('Failed to fetch upload details')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.success) {
          setUpload(data.upload)
        } else {
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
      const interval = setInterval(() => {
        fetchUpload()
      }, 2000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [upload?.analysisStatus])

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

  // Handle language change for instant translation
  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === reportLanguage) {
      setShowLanguageMenu(false)
      return
    }

    setShowLanguageMenu(false)
    setReportLanguage(newLanguage)
    setTranslationError(null)

    // German is the base language — use original
    if (language === 'de') {
      setTranslatedReport(originalReport)
      return
    }

    // Check if report is already in the target language
    const currentLang = originalReport?._meta?.language?.code
    if (currentLang === language) {
      setTranslatedReport(originalReport)
      return
    }
    // Need to translate
    if (!originalReport) {
      setTranslationError(t.common.error ? t.common.error : 'No report available to translate')
      return
    }

    setTranslationError(null)
    setIsTranslating(true)

    try {
      // The translate-report API checks DB cache first, then translates + saves if not cached
      const response = await fetch('/api/ai/translate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: originalReport,
          targetLanguage: newLanguage,
          uploadId: uploadId,
        }),
      })
      .catch((err) => {
        console.error('Translation error:', err)
        setTranslationError(err instanceof Error ? err.message : 'Translation failed')
      })
      .finally(() => {
        setIsTranslating(false)
      })
    } catch (err) {
      console.error('Translation error:', err)
      setTranslationError(err instanceof Error ? err.message : 'Translation failed')
      setIsTranslating(false)
    }
  }

  // Store original report when upload changes
  useEffect(() => {
    if (upload?.analysis) {
      const analysisData = typeof upload.analysis === 'string'
        ? JSON.parse(upload.analysis)
        : upload.analysis

      if (analysisData && typeof analysisData === 'object' && !Array.isArray(analysisData)) {
        // Store the report as original (German base)
        setOriginalReport(analysisData)
        setTranslatedReport(analysisData)

        // Language is now driven by the global useLanguage() context

      }
    }
  }, [upload?.analysis])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get mascot mood based on status
  const getMascotMood = () => {
    if (!upload) return 'thinking'
    switch (upload.analysisStatus) {
      case 'completed': return upload.grade && upload.grade <= 2 ? 'celebrating' : 'happy'
      case 'failed': return 'encouraging'
      case 'processing': return 'thinking'
      default: return 'happy'
    }
  }

  // Get mascot message based on status
  const getMascotMessage = () => {
    if (!upload) return 'Loading...'
    switch (upload.analysisStatus) {
      case 'completed':
        return upload.grade && upload.grade <= 2
          ? 'Excellent work!'
          : 'Analysis complete!'
      case 'failed': return 'Let\'s try again!'
      case 'processing': return t.upload.analyzing || 'Analyzing...'
      case 'pending': return 'Getting ready...'
      default: return 'Let\'s learn together!'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <OwlMascot mood="thinking" size="lg" message={t.common.loading || 'Loading test details...'} />
          <div className="mt-6">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
            <p className="text-[var(--gray-600)] mt-2 font-medium">{t.common.loading || 'Loading...'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <OwlMascot mood="encouraging" size="lg" message={t.errors.generic || 'Oops! Something went wrong'} />
          </div>
          <div className="card-story p-6 border-2 border-[var(--coral)]">
            <XCircle className="w-12 h-12 text-[var(--coral)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--gray-800)] text-center mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {t.common.error || 'Error'}
            </h2>
            <p className="text-[var(--gray-600)] text-center mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary w-full"
            >
              {'Back to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!upload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <OwlMascot mood="thinking" size="lg" message={'Where did it go?'} />
          <p className="text-[var(--gray-600)] mt-4">{'Upload not found'}</p>
          <Link href="/dashboard" className="btn-primary inline-block mt-4">
            {'Back to Dashboard'}
          </Link>
        </div>
      </div>
    )
  }

  const StatusBadge = () => {
    switch (upload.analysisStatus) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)]/20 px-4 py-1.5 text-sm font-semibold text-[var(--gold-dark)]">
            <Clock className="h-4 w-4" />
            {t.status.pending || 'Pending'}
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/20 px-4 py-1.5 text-sm font-semibold text-[var(--primary-dark)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.status.processing || 'Processing'}
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--success)]/20 px-4 py-1.5 text-sm font-semibold text-[var(--success-dark)]">
            <CheckCircle className="h-4 w-4" />
            {t.status.completed || 'Completed'}
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--coral)]/20 px-4 py-1.5 text-sm font-semibold text-[var(--coral)]">
            <AlertCircle className="h-4 w-4" />
            {t.status.failed || 'Failed'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--gray-200)] px-4 py-1.5 text-sm font-semibold text-[var(--gray-600)]">
            {'Unknown'}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-bounce-in">
            <div className="text-center mb-4">
              <OwlMascot mood="thinking" size="md" message={t.common.confirmDelete || 'Are you sure?'} showMessage={false} />
            </div>
            <div className="mb-4 flex items-center gap-3 justify-center">
              <div className="rounded-full bg-[var(--coral)]/20 p-3">
                <Trash2 className="h-6 w-6 text-[var(--coral)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                {t.upload.deleteTestConfirm || 'Delete Test?'}
              </h2>
            </div>
            <p className="mb-6 text-[var(--gray-600)] text-center">
              {t.upload.deleteTestWarning || 'Are you sure you want to delete this test? This action cannot be undone and will permanently remove the test and its analysis.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-coral flex-1 flex items-center justify-center gap-2"
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

      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[var(--primary)] via-[var(--primary-dark)] to-[var(--lavender)] text-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href={upload.childId ? `/dashboard/children/${upload.childId}` : '/dashboard'}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.common?.backTo || 'Back to'} {upload.child?.name || t.common?.dashboard || 'Dashboard'}
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {t.analysis?.title || 'Test Analysis'}
              </h1>
              <p className="text-white/80 text-lg">
                {upload.subject ? (
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {upload.subject}
                  </span>
                ) : (
                  t.analysis?.description || 'View details and analysis for this test'
                )}
              </p>

              {/* Quick info */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-white/70 text-sm">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {upload.child.name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(upload.uploadedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {formatFileSize(upload.fileSize)}
                </span>
              </div>
            </div>

            {/* Mascot */}
            <div className="flex-shrink-0">
              <OwlMascot
                mood={getMascotMood()}
                size="lg"
                message={getMascotMessage()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Duplicate Detection Message */}
        {showDuplicateMessage && (
          <div className="mb-6 rounded-2xl bg-[var(--primary-soft)] border-2 border-[var(--primary)]/30 p-4 shadow-sm animate-bounce-in">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--primary-dark)] mb-1">
                  {t.upload?.duplicateTitle || 'Duplicate Upload Detected'}
                </h3>
                <p className="text-sm text-[var(--gray-700)]">
                  {duplicateMessage}
                </p>
              </div>
              <button
                onClick={() => setShowDuplicateMessage(false)}
                className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                aria-label="Dismiss message"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator for pending/processing */}
        {(upload.analysisStatus === 'pending' || upload.analysisStatus === 'processing') && (
          <div className="mb-6 card-story p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--primary-soft)] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[var(--primary)] animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {upload.analysisStatus === 'pending'
                    ? (t.upload?.preparing || 'Preparing Analysis')
                    : (t.upload?.analyzingTest || 'Analyzing Your Test')}
                </h3>
                <p className="text-sm text-[var(--gray-600)]">
                  {upload.analysisStatus === 'pending'
                    ? (t.upload?.preparingDesc || 'Your test will be analyzed shortly...')
                    : (t.upload?.analyzingDesc || 'AI is reading and analyzing the test. This page will refresh automatically.')}
                </p>
              </div>
            </div>
            <div className="w-full bg-[var(--gray-200)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--lavender)] rounded-full animate-pulse"
                style={{ width: upload.analysisStatus === 'pending' ? '30%' : '60%' }}
              />
            </div>
          </div>
        )}

        {/* Error Message with Retry Button */}
        {upload.analysisStatus === 'failed' && (
          <div className="mb-6 card-story p-6 border-2 border-[var(--coral)]/30 bg-[var(--coral)]/5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--coral)]/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[var(--coral)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--coral)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {t.upload?.analysisFailed || 'Analysis Failed'}
                </h3>
                <p className="text-[var(--gray-700)]">
                  {upload.errorMessage || t.upload?.analysisErrorDesc || 'An error occurred while analyzing the test. Please try again.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="btn-coral w-full flex items-center justify-center gap-2"
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
                <div className="card-story p-4 border-l-4 border-[var(--primary)]">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-[var(--primary)]" />
                    <p className="text-sm font-medium text-[var(--gray-600)]">{t.upload?.subject || 'Subject'}</p>
                  </div>
                  <SubjectTag subject={upload.subject} size="lg" />
                </div>
              )}

              {upload.grade !== null && (
                <div className="card-story p-4 border-l-4 border-[var(--success)]">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-5 w-5 text-[var(--success)]" />
                    <p className="text-sm font-medium text-[var(--gray-600)]">{t.upload?.gradeReceived || 'Grade Received'}</p>
                  </div>
                  <GradeBadge grade={Math.round(upload.grade)} size="lg" showLabel />
                </div>
              )}

              <div className="card-story p-4 border-l-4 border-[var(--lavender)]">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-[var(--lavender)]" />
                  <p className="text-sm font-medium text-[var(--gray-600)]">{t.analysis?.analyzedAt || 'Analyzed'}</p>
                </div>
                <p className="text-lg font-bold text-[var(--gray-800)]">
                  {upload.processedAt ? formatDate(upload.processedAt) : formatDate(upload.uploadedAt)}
                </p>
              </div>
            </div>

            {/* Language Selector for Report */}
            {upload.analysis && (
              <div dir="ltr" className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--gray-600)]">
                  <Globe className="h-4 w-4" />
                  <span>{t.analysis?.reportLanguage || 'Report Language:'}</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    disabled={isTranslating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-[var(--gray-200)] hover:border-[var(--primary)] transition-colors disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
                        <span className="text-sm font-medium">{t.common?.translating || 'Translating...'}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">{REPORT_LANGUAGES[reportLanguage].flag}</span>
                        <span className="text-sm font-medium">{REPORT_LANGUAGES[reportLanguage].native}</span>
                        <ChevronDown className={`h-4 w-4 text-[var(--gray-500)] transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>

                  {/* Language Dropdown */}
                  {showLanguageMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[var(--gray-200)] py-2 z-50">
                      {Object.entries(REPORT_LANGUAGES).map(([code, lang]) => (
                        <button
                          key={code}
                          onClick={() => handleLanguageChange(code as Language)}
                          className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[var(--primary-soft)] transition-colors ${reportLanguage === code ? 'bg-[var(--primary-soft)] text-[var(--primary-dark)]' : ''
                            }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <div>
                            <p className="text-sm font-medium">{lang.native}</p>
                            <p className="text-xs text-[var(--gray-500)]">{lang.name}</p>
                          </div>
                          {reportLanguage === code && (
                            <CheckCircle className="h-4 w-4 text-[var(--primary)] ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Translation Error */}
            {translationError && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--coral)]/10 border border-[var(--coral)]/30 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[var(--coral)]" />
                <span className="text-sm text-[var(--coral)]">{translationError}</span>
                <button
                  onClick={() => setTranslationError(null)}
                  className="ml-auto text-[var(--coral)] hover:text-[var(--coral-dark)]"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Parent Report */}
            {(upload.analysis || upload.extractedText) && (
              <div className="mb-6" dir={['ar', 'fa', 'ku'].includes(language) ? 'rtl' : 'ltr'}>
                {(() => {
                  // Use translated report if available, otherwise original
                  const analysisData = translatedReport || (upload.analysis ?
                    (typeof upload.analysis === 'string' ? JSON.parse(upload.analysis) : upload.analysis) : null);

                  if (analysisData && typeof analysisData === 'object' && !Array.isArray(analysisData)) {
                    return (
                      <ErrorBoundary
                        fallback={
                          <div className="card-story p-6 border-2 border-[var(--coral)]/30">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-6 w-6 text-[var(--coral)] flex-shrink-0 mt-0.5" />
                              <div>
                                <h3 className="text-lg font-semibold text-[var(--coral)] mb-2">
                                  {t.errors?.reportDisplay || 'Report Display Error'}
                                </h3>
                                <p className="text-[var(--gray-700)] mb-3">
                                  {t.errors?.reportDisplayDesc || 'The analysis completed successfully, but there was an error displaying the report.'}
                                </p>
                                <p className="text-sm text-[var(--gray-600)]">
                                  {t.errors?.rawAnalysisData || 'Raw analysis data is available below. Please try refreshing the page.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <ParentReport
                          data={analysisData}
                          extractedText={upload.extractedText}
                          childName={upload.child?.name}
                          language={language as any}
                        />
                      </ErrorBoundary>
                    );
                  } else if (upload.analysis?.ai) {
                    const transformedData = transformToReportFormat(upload.analysis.ai)
                    return (
                      <ErrorBoundary
                        fallback={
                          <div className="card-story p-6 border-2 border-[var(--coral)]/30">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-6 w-6 text-[var(--coral)] flex-shrink-0 mt-0.5" />
                              <div>
                                <h3 className="text-lg font-semibold text-[var(--coral)] mb-2">
                                  Report Display Error
                                </h3>
                                <p className="text-[var(--gray-700)] mb-3">
                                  The analysis completed successfully, but there was an error displaying the report.
                                </p>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <GradeAIParentReport
                          analysisData={transformedData}
                          uploadId={uploadId}
                        />
                      </ErrorBoundary>
                    );
                  } else if (upload.extractedText) {
                    return (
                      <div className="card-story p-6 border-2 border-[var(--gold)]/30 bg-[var(--gold)]/5">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-6 w-6 text-[var(--gold)] flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-lg font-semibold text-[var(--gold-dark)] mb-2">
                              {t.upload?.reportGenerationProgress || 'Report Generation in Progress'}
                            </h3>
                            <p className="text-[var(--gray-700)] mb-3">
                              {t.upload?.reportGenerationDesc || 'Text extraction completed successfully. The structured report is being generated.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* Show AI Error if present but analysis still completed */}
            {upload.analysis?.aiError && !upload.analysis?.ai && (
              <div className="mb-6 card-story p-6 border-2 border-[var(--gold)]/30 bg-[var(--gold)]/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-[var(--gold)] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--gold-dark)] mb-2">
                      {t.errors?.aiUnavailable || 'AI Analysis Unavailable'}
                    </h3>
                    <p className="text-[var(--gray-700)] mb-3">
                      {t.errors?.aiUnavailableDesc || 'The text was extracted successfully, but AI analysis could not be completed.'}
                    </p>
                    <p className="text-sm text-[var(--gray-600)]">
                      {t.common?.errorLabel || 'Error:'} {upload.analysis.aiError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Features: Flashcards & Fairness Check */}
            {upload.analysis && (
              <div className="space-y-6 mb-6" dir={['ar', 'fa', 'ku'].includes(language) ? 'rtl' : 'ltr'}>
                {/* Flashcards Section - Independent AI Analysis */}
                <FlashcardsPremiumSection
                  isPremium={isPremiumUser}
                  childName={upload.child.name}
                  analysisData={translatedReport || (typeof upload.analysis === 'string' ? JSON.parse(upload.analysis) : upload.analysis)}
                  onUpgrade={() => handleUpgrade('flashcards')}
                  extractedText={upload.extractedText}
                  grade={upload.child.grade}
                  subject={upload.subject || undefined}
                  schoolType={upload.child.schoolType}
                  language={language as any}
                  uploadId={upload.id}
                  cachedData={upload.flashcards}
                />

                {/* Fairness Check Section - Independent AI Analysis */}
                <FairnessCheckPremiumSection
                  isPremium={isPremiumUser}
                  childName={upload.child.name}
                  analysisData={translatedReport || (typeof upload.analysis === 'string' ? JSON.parse(upload.analysis) : upload.analysis)}
                  onUpgrade={() => handleUpgrade('fairness')}
                  extractedText={upload.extractedText}
                  grade={upload.child.grade}
                  subject={upload.subject || undefined}
                  schoolType={upload.child.schoolType}
                  language={language as any}
                  uploadId={upload.id}
                  cachedData={upload.fairnessCheck}
                />

                {/* Learning Material Section - coming soon */}
                {/* <LearningMaterialPremiumSection ... /> */}
              </div>
            )}

            {/* Upload Details - Collapsible */}
            <details className="mb-6 card-story overflow-hidden">
              <summary className="cursor-pointer p-4 font-semibold text-[var(--gray-800)] flex items-center gap-2 hover:bg-[var(--gray-100)] transition-colors">
                <FileText className="h-5 w-5 text-[var(--primary)]" />
                {'Upload Details'}
              </summary>
              <div className="px-4 pb-4 border-t border-[var(--gray-200)]">
                <dl className="space-y-3 mt-4">
                  <div className="flex justify-between">
                    <dt className="font-medium text-[var(--gray-600)]">{t.child.name || 'Student'}:</dt>
                    <dd className="text-[var(--gray-800)]">{upload.child.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-[var(--gray-600)]">{t.child.grade || 'Class'}:</dt>
                    <dd className="text-[var(--gray-800)]">
                      {upload.child.grade} • {t.schoolTypes[upload.child.schoolType as keyof typeof t.schoolTypes] || upload.child.schoolType}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-[var(--gray-600)]">File Name:</dt>
                    <dd className="truncate text-[var(--gray-800)]">{upload.fileName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-[var(--gray-600)]">File Size:</dt>
                    <dd className="text-[var(--gray-800)]">{formatFileSize(upload.fileSize)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-[var(--gray-600)]">{t.upload.uploaded || 'Uploaded'}:</dt>
                    <dd className="text-[var(--gray-800)]">{formatDate(upload.uploadedAt)}</dd>
                  </div>
                  {upload.processedAt && (
                    <div className="flex justify-between">
                      <dt className="font-medium text-[var(--gray-600)]">{'Processed'}:</dt>
                      <dd className="text-[var(--gray-800)]">{formatDate(upload.processedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </details>

            {/* Raw Extracted Text - Collapsible */}
            {upload.extractedText && (
              <details className="mb-6 card-story overflow-hidden">
                <summary className="cursor-pointer p-4 font-semibold text-[var(--gray-800)] flex items-center gap-2 hover:bg-[var(--gray-100)] transition-colors">
                  <FileText className="h-5 w-5 text-[var(--lavender)]" />
                  {t.analysis.extractedText || 'View Extracted Text'}
                </summary>
                <div className="px-4 pb-4 border-t border-[var(--gray-200)]">
                  <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-[var(--gray-200)] bg-[var(--gray-100)] p-4">
                    <p className="text-sm text-[var(--gray-700)] whitespace-pre-wrap font-mono">
                      {upload.extractedText}
                    </p>
                  </div>
                </div>
              </details>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--gray-200)]">
          <Link
            href={upload.childId ? `/dashboard/children/${upload.childId}` : '/dashboard'}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            {t.common.back || 'Back'}
          </Link>
          <Link
            href="/uploads"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            {t.upload.uploadAnother || 'Upload Another Test'}
          </Link>
          {upload.analysisStatus === 'completed' && (upload.analysis || upload.extractedText) && (
            <button
              onClick={() => {
                window.print();
              }}
              className="btn-gold inline-flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              {t.analysis.downloadPDF || 'Download PDF'}
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-ghost inline-flex items-center gap-2 text-[var(--coral)] hover:bg-[var(--coral)]/10"
          >
            <Trash2 className="h-5 w-5" />
            {t.common.delete || 'Delete'}
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />
    </div>
  )
}
