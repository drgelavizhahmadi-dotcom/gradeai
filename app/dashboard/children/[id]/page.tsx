'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  GraduationCap,
  FileText,
  TrendingUp,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  ArrowRight
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import Breadcrumbs from '@/components/Breadcrumbs'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { Mascot, FoxMascot } from '@/components/mascots'
import { GradeBadge } from '@/components/ui/GradeBadge'

interface Child {
  id: string
  name: string
  grade: number
  schoolType: string
  createdAt: string
}

interface UploadItem {
  id: string
  fileName: string
  uploadedAt: string
  analysisStatus: string
  grade: number | null
}

interface Stats {
  totalTests: number
  averageGrade: number | null
  completedTests: number
  pendingTests: number
}

export default function ChildProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const childId = params.id as string

  const [child, setChild] = useState<Child | null>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [stats, setStats] = useState<Stats>({ totalTests: 0, averageGrade: null, completedTests: 0, pendingTests: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedUploads, setSelectedUploads] = useState<Set<string>>(new Set())
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  useEffect(() => {
    if (childId) {
      fetchChildData()
    }
  }, [childId])

  const fetchChildData = async () => {
    try {
      setError(null)
      const childResponse = await fetch(`/api/children/${childId}`)

      if (!childResponse.ok) {
        if (childResponse.status === 404) {
          setChild(null)
          setLoading(false)
          return
        }
        throw new Error('Failed to load child profile. Please check your connection and try again.')
      }

      const childData = await childResponse.json()

      if (childData.success) {
        setChild(childData.child)

        const uploadList = childData.child.uploads || []
        const completed = uploadList.filter((u: UploadItem) => u.analysisStatus === 'completed')
        const gradesArray = completed.map((u: UploadItem) => u.grade).filter((g: number | null) => g !== null)

        setStats({
          totalTests: uploadList.length,
          averageGrade: gradesArray.length > 0 ? gradesArray.reduce((a: number, b: number) => a + b, 0) / gradesArray.length : null,
          completedTests: completed.length,
          pendingTests: uploadList.filter((u: UploadItem) => u.analysisStatus === 'pending' || u.analysisStatus === 'processing').length,
        })

        setUploads(uploadList)
      } else {
        throw new Error(childData.error || 'Failed to load child profile')
      }
    } catch (err) {
      console.error('Error fetching child data:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading the child profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChild = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete child')
      }
    } catch (error) {
      console.error('Error deleting child:', error)
      alert('An error occurred while deleting child')
    } finally {
      setDeleteLoading(false)
    }
  }

  const toggleSelectUpload = (uploadId: string) => {
    const newSelected = new Set(selectedUploads)
    if (newSelected.has(uploadId)) {
      newSelected.delete(uploadId)
    } else {
      newSelected.add(uploadId)
    }
    setSelectedUploads(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedUploads.size === uploads.length) {
      setSelectedUploads(new Set())
    } else {
      setSelectedUploads(new Set(uploads.map(u => u.id)))
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true)
    try {
      const deletePromises = Array.from(selectedUploads).map(uploadId =>
        fetch(`/api/uploads/${uploadId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const allSuccessful = results.every(r => r.ok)

      if (allSuccessful) {
        await fetchChildData()
        setSelectedUploads(new Set())
        setBulkDeleteModal(false)
      } else {
        alert('Some uploads failed to delete')
      }
    } catch (error) {
      console.error('Error deleting uploads:', error)
      alert('An error occurred while deleting uploads')
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success-dark)] border border-[var(--success)]">
            <CheckCircle className="h-3.5 w-3.5" />
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary-dark)] border border-[var(--primary)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processing
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--error-soft)] px-3 py-1 text-xs font-semibold text-[var(--error)] border border-[var(--error)]">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-soft)] px-3 py-1 text-xs font-semibold text-[var(--gold-dark)] border border-[var(--warning)]">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        )
    }
  }

  // Determine mascot mood based on stats
  const getMascotMood = () => {
    if (stats.averageGrade && stats.averageGrade <= 2.0) return 'celebrating'
    if (stats.pendingTests > 0) return 'thinking'
    if (stats.totalTests === 0) return 'encouraging'
    return 'happy'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <FoxMascot mood="thinking" size="xl" message="Loading profile..." />
            <p className="text-[var(--gray-600)] font-medium mt-4">Getting everything ready...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <div className="card-story p-12 text-center bg-white mt-6">
            <div className="flex justify-center mb-4">
              <FoxMascot mood="encouraging" size="lg" message="Oops! Let me try again..." />
            </div>
            <h3 className="text-xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Failed to Load Profile
            </h3>
            <p className="text-[var(--gray-600)] mb-6">{error}</p>
            <button
              onClick={fetchChildData}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <div className="card-story p-12 text-center bg-white mt-6">
            <div className="flex justify-center mb-4">
              <FoxMascot mood="thinking" size="lg" message="I can't find this profile..." />
            </div>
            <h3 className="text-xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Child Not Found
            </h3>
            <p className="text-[var(--gray-600)] mb-6">
              The child profile you're looking for doesn't exist or may have been deleted.
            </p>
            <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs />

        {/* Header with Mascot */}
        <div className="mb-8 mt-6 bg-warm-gradient rounded-3xl p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="hidden sm:block">
                <FoxMascot
                  mood={getMascotMood()}
                  size="lg"
                  message={stats.totalTests === 0 ? `Let's upload ${child.name}'s first test!` : `${child.name} is doing great!`}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--gray-800)] sm:text-4xl mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {child.name}
                </h1>
                <p className="text-lg text-[var(--gray-600)]">
                  Grade {child.grade} • {child.schoolType}
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link
                href={`/dashboard/children/${child.id}/progress`}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--lavender)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--lavender-dark)] transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <TrendingUp className="h-4 w-4" />
                Progress
              </Link>
              <Link
                href={`/dashboard/children/${child.id}/edit`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t.common?.edit || 'Edit Profile'}
              </Link>
              <button
                onClick={() => setDeleteModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--error)] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-90 transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Trash2 className="h-4 w-4" />
                {t.common?.delete || 'Delete'}
              </button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-4 right-8 text-4xl opacity-20">🦊</div>
          <div className="absolute bottom-4 right-24 text-3xl opacity-20">⭐</div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card-story p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[var(--primary-soft)] p-4">
                <FileText className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">Total Tests</p>
                <p className="text-3xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {stats.totalTests}
                </p>
              </div>
            </div>
          </div>

          <div className="card-story p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[var(--success-soft)] p-4">
                <TrendingUp className="h-7 w-7 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">Avg. Grade</p>
                <div className="mt-1">
                  <GradeBadge grade={stats.averageGrade} size="lg" />
                </div>
              </div>
            </div>
          </div>

          <div className="card-story p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[var(--success-soft)] p-4">
                <CheckCircle className="h-7 w-7 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">{t.child?.completed || 'Completed'}</p>
                <p className="text-3xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {stats.completedTests}
                </p>
              </div>
            </div>
          </div>

          <div className="card-story p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[var(--warning-soft)] p-4">
                <Clock className="h-7 w-7 text-[var(--gold-dark)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">{t.child?.pending || 'Pending'}</p>
                <p className="text-3xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {stats.pendingTests}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action - Upload */}
        <div className="mb-8">
          <Link
            href={`/dashboard/upload?childId=${child.id}`}
            className="group card-story block p-8 text-center border-2 border-dashed border-[var(--gray-300)] hover:border-[var(--coral)] hover:bg-[var(--coral-soft)] transition-all bg-white"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--coral-soft)] flex items-center justify-center mb-4 group-hover:bg-[var(--coral)] transition-colors">
              <Upload className="h-8 w-8 text-[var(--coral)] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {t.child?.uploadNewTest || 'Upload New Test'}
            </h3>
            <p className="text-sm text-[var(--gray-500)]">
              {(t.child?.uploadForChild || 'Upload a test for {name} to get AI-powered analysis').replace('{name}', child.name)}
            </p>
          </Link>
        </div>

        {/* Test History */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                {t.child?.testHistory || 'Test History'}
              </h2>
              {uploads.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUploads.size === uploads.length && uploads.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-[var(--primary)] border-[var(--gray-300)] rounded focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--gray-500)]">{t.common?.selectAll || 'Select All'}</span>
                </label>
              )}
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedUploads.size > 0 && (
            <div className="mb-4 rounded-2xl bg-[var(--primary-soft)] border-2 border-[var(--primary)] p-4 flex items-center justify-between animate-bounce-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{selectedUploads.size}</span>
                </div>
                <p className="text-sm font-semibold text-[var(--gray-800)]">
                  {selectedUploads.size} {selectedUploads.size === 1 ? 'test selected' : 'tests selected'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUploads(new Set())}
                  className="text-sm font-semibold text-[var(--gray-600)] hover:text-[var(--gray-800)] transition-colors"
                >
                  {t.common?.cancel || 'Cancel'}
                </button>
                <button
                  onClick={() => setBulkDeleteModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--error)] px-4 py-2 text-sm font-semibold text-white hover:brightness-90 transition-all"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Trash2 className="h-4 w-4" />
                  {t.common?.delete || 'Delete'}
                </button>
              </div>
            </div>
          )}

          {uploads.length === 0 ? (
            <div className="card-story p-12 text-center bg-white">
              <div className="flex justify-center mb-4">
                <FoxMascot mood="encouraging" size="lg" message={`Upload ${child.name}'s first test!`} />
              </div>
              <h3 className="text-xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                No tests uploaded yet
              </h3>
              <p className="text-[var(--gray-600)] mb-6 max-w-md mx-auto">
                Upload {child.name}'s first test to start tracking their progress and get AI-powered insights
              </p>
              <Link
                href={`/dashboard/upload?childId=${child.id}`}
                className="btn-coral inline-flex items-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Upload First Test
              </Link>
            </div>
          ) : (
            <div className="card-story bg-white overflow-hidden p-0">
              <div className="divide-y divide-[var(--gray-200)]">
                {uploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center gap-3 p-5 hover:bg-[var(--gray-50)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUploads.has(upload.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleSelectUpload(upload.id)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 text-[var(--primary)] border-[var(--gray-300)] rounded focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <Link
                      href={`/uploads/${upload.id}`}
                      className="flex items-center justify-between gap-4 flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--gray-800)] truncate">{upload.fileName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-[var(--gray-500)]">
                              {new Date(upload.uploadedAt).toLocaleDateString()}
                            </span>
                            {upload.grade && (
                              <>
                                <span className="text-[var(--gray-300)]">•</span>
                                <GradeBadge grade={upload.grade} size="sm" />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-xs text-[var(--gray-400)] hidden sm:block">
                          {new Date(upload.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {getStatusBadge(upload.analysisStatus)}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          onConfirm={handleDeleteChild}
          loading={deleteLoading}
          title={t.common?.confirmDelete || 'Confirm Delete'}
          message={`${t.child?.confirmDeleteMessage || 'Are you sure you want to delete'} "${child.name}"? ${t.child?.deleteWarning || 'This action cannot be undone and will delete all associated tests.'}`}
        />

        {/* Bulk Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={bulkDeleteModal}
          onClose={() => setBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
          loading={bulkDeleteLoading}
          title={t.upload?.bulkDelete || 'Delete Multiple Tests?'}
          message={`${t.upload?.bulkDeleteMessage || 'Are you sure you want to delete'} ${selectedUploads.size} ${selectedUploads.size === 1 ? (t.upload?.test || 'test') : (t.upload?.tests || 'tests')}? ${t.upload?.bulkDeleteWarning || 'This action cannot be undone.'}`}
        />
      </div>
    </div>
  )
}
