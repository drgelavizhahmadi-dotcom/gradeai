'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/providers/LanguageProvider'
import {
  Upload,
  FileText,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Users,
  BarChart3,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Sparkles
} from 'lucide-react'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { OwlMascot } from '@/components/mascots'
import { GradeBadge } from '@/components/ui/GradeBadge'

interface Child {
  id: string
  name: string
  grade: number
  schoolType: string
  totalTests: number
  averageGrade: number | null
  lastTestDate: string | null
}

interface Upload {
  id: string
  fileName: string
  uploadedAt: string
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed'
  child: {
    name: string
  }
  grade: number | null
}

interface Stats {
  totalTests: number
  pendingTests: number
  averageGrade: number | null
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [recentUploads, setRecentUploads] = useState<Upload[]>([])
  const [stats, setStats] = useState<Stats>({ totalTests: 0, pendingTests: 0, averageGrade: null })
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; childId: string | null; childName: string }>({
    isOpen: false,
    childId: null,
    childName: ''
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedUploads, setSelectedUploads] = useState<Set<string>>(new Set())
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const childrenResponse = await fetch('/api/children')
      const childrenData = await childrenResponse.json()

      if (childrenData.children) {
        const childrenWithStats = childrenData.children.map((child: any) => {
          const uploads = child.uploads || []
          const completedUploads = uploads.filter((u: any) => u.analysisStatus === 'completed')
          const grades = completedUploads.map((u: any) => u.grade).filter((g: any) => g !== null)

          return {
            id: child.id,
            name: child.name,
            grade: child.grade,
            schoolType: child.schoolType,
            totalTests: uploads.length,
            averageGrade: grades.length > 0 ? grades.reduce((a: number, b: number) => a + b, 0) / grades.length : null,
            lastTestDate: uploads.length > 0 ? uploads[0].uploadedAt : null,
          }
        })

        setChildren(childrenWithStats)

        const allUploads = childrenData.children.flatMap((child: any) =>
          (child.uploads || []).map((upload: any) => ({
            ...upload,
            child: { name: child.name }
          }))
        )

        const sortedUploads = allUploads.sort((a: any, b: any) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
        setRecentUploads(sortedUploads.slice(0, 5))

        const totalTests = allUploads.length
        const pendingTests = allUploads.filter((u: any) =>
          u.analysisStatus === 'pending' || u.analysisStatus === 'processing'
        ).length
        const completedTests = allUploads.filter((u: any) => u.analysisStatus === 'completed')
        const allGrades = completedTests.map((u: any) => u.grade).filter((g: any) => g !== null)

        setStats({
          totalTests,
          pendingTests,
          averageGrade: allGrades.length > 0 ? allGrades.reduce((a: number, b: number) => a + b, 0) / allGrades.length : null,
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusText = {
      completed: t.status?.completed || 'Completed',
      processing: t.status?.processing || 'Processing',
      failed: t.status?.failed || 'Failed',
      pending: t.status?.pending || 'Pending',
    }

    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-3 py-1 text-xs font-semibold text-[var(--success-dark)] border border-[var(--success)]">
            <CheckCircle className="h-3.5 w-3.5" />
            {statusText.completed}
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary-dark)] border border-[var(--primary)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {statusText.processing}
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--error-soft)] px-3 py-1 text-xs font-semibold text-[var(--error)] border border-[var(--error)]">
            <AlertCircle className="h-3.5 w-3.5" />
            {statusText.failed}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--warning-soft)] px-3 py-1 text-xs font-semibold text-[var(--gold-dark)] border border-[var(--warning)]">
            <Clock className="h-3.5 w-3.5" />
            {statusText.pending}
          </span>
        )
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDeleteChild = async () => {
    if (!deleteModal.childId) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/children/${deleteModal.childId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchDashboardData()
        setDeleteModal({ isOpen: false, childId: null, childName: '' })
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
    if (selectedUploads.size === recentUploads.length) {
      setSelectedUploads(new Set())
    } else {
      setSelectedUploads(new Set(recentUploads.map(u => u.id)))
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
        await fetchDashboardData()
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

  // Determine owl mood based on stats
  const getOwlMood = () => {
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
            <OwlMascot mood="thinking" size="xl" message="Loading your dashboard..." />
            <p className="text-[var(--gray-600)] font-medium mt-4">Getting everything ready...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section with Mascot */}
        <div className="mb-8 bg-warm-gradient rounded-3xl p-8 relative overflow-hidden">
          <div className="flex items-center gap-6">
            <div className="hidden sm:block">
              <OwlMascot
                mood={getOwlMood()}
                size="xl"
                message={stats.totalTests === 0 ? "Let's get started!" : stats.averageGrade && stats.averageGrade <= 2.0 ? "Great progress!" : "Welcome back!"}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[var(--gray-800)] sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {t.dashboard?.welcome || 'Welcome back!'}
              </h1>
              <p className="text-lg text-[var(--gray-600)]">
                {t.dashboard?.totalTests || "Track and analyze your children's test results with AI-powered insights"}
              </p>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-4 right-8 text-4xl opacity-20">📚</div>
          <div className="absolute bottom-4 right-24 text-3xl opacity-20">✨</div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Tests */}
          <div className="card-story p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[var(--primary-soft)] p-4">
                <FileText className="h-7 w-7 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">{t.dashboard?.totalTests || 'Total Tests'}</p>
                <p className="text-3xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {stats.totalTests}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Analysis */}
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

          {/* Average Grade */}
          <div className="card-story p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[var(--success-soft)] p-4">
                <TrendingUp className="h-7 w-7 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">{t.dashboard?.averageGrade || 'Avg. Grade'}</p>
                <div className="mt-1">
                  <GradeBadge grade={stats.averageGrade} size="lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Children */}
          <div className="card-story p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[var(--lavender-soft)] p-4">
                <Users className="h-7 w-7 text-[var(--lavender)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">{t.dashboard?.totalChildren || 'Children'}</p>
                <p className="text-3xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {children.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Children Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
              {t.nav?.children || 'Your Children'}
            </h2>
            <Link
              href="/dashboard/children/new"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t.child?.addNew || 'Add Child'}
            </Link>
          </div>

          {children.length === 0 ? (
            <div className="card-story p-12 text-center bg-white">
              <div className="flex justify-center mb-4">
                <OwlMascot mood="encouraging" size="lg" message="Add your first child to get started!" />
              </div>
              <h3 className="text-xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                No children added yet
              </h3>
              <p className="text-[var(--gray-600)] mb-6 max-w-md mx-auto">
                Start tracking your child's academic journey by adding their profile. You can add multiple children!
              </p>
              <Link
                href="/dashboard/children/new"
                className="btn-coral inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Your First Child
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {children.map((child, index) => (
                <div
                  key={child.id}
                  className="card-story p-6 bg-white group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar with gradient based on index */}
                      <div className={`
                        rounded-2xl p-4
                        ${index % 3 === 0 ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)]' : ''}
                        ${index % 3 === 1 ? 'bg-gradient-to-br from-[var(--coral)] to-[var(--coral-light)]' : ''}
                        ${index % 3 === 2 ? 'bg-gradient-to-br from-[var(--lavender)] to-[var(--lavender-light)]' : ''}
                      `}>
                        <GraduationCap className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                          {child.name}
                        </h3>
                        <p className="text-sm text-[var(--gray-500)]">
                          Grade {child.grade} • {child.schoolType}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/dashboard/children/${child.id}/edit`}
                        className="rounded-lg p-2 text-[var(--gray-500)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition-colors"
                        title={t.common?.edit || 'Edit'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, childId: child.id, childName: child.name })}
                        className="rounded-lg p-2 text-[var(--gray-500)] hover:bg-[var(--error-soft)] hover:text-[var(--error)] transition-colors"
                        title={t.common?.delete || 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--gray-500)]">{t.child?.totalTests || 'Total Tests'}</span>
                      <span className="text-sm font-bold text-[var(--gray-700)]">{child.totalTests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--gray-500)]">{t.child?.avgGrade || 'Average Grade'}</span>
                      <GradeBadge grade={child.averageGrade} size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--gray-500)]">{t.child?.testHistory || 'Last Test'}</span>
                      <span className="text-xs text-[var(--gray-400)]">
                        {child.lastTestDate ? formatDate(child.lastTestDate) : '-'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/children/${child.id}`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--gray-100)] px-4 py-3 text-sm font-semibold text-[var(--gray-700)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {t.child?.profile || 'Child Profile'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Uploads */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                {t.dashboard?.recentUploads || 'Recent Uploads'}
              </h2>
              {recentUploads.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUploads.size === recentUploads.length && recentUploads.length > 0}
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

          <div className="card-story bg-white overflow-hidden p-0">
            {recentUploads.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="flex justify-center mb-4">
                  <OwlMascot mood="encouraging" size="lg" message="Upload your first test!" />
                </div>
                <h3 className="text-xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {t.dashboard?.noTests || 'No uploads yet'}
                </h3>
                <p className="text-[var(--gray-600)] mb-6 max-w-md mx-auto">
                  {t.dashboard?.noTestsDesc || 'Get started by uploading your first test for AI analysis'}
                </p>
                <Link
                  href="/dashboard/upload"
                  className="btn-coral inline-flex items-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  {t.upload?.title || 'Upload Your First Test'}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[var(--gray-200)]">
                {recentUploads.map((upload) => (
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
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] flex items-center justify-center">
                            <FileText className="h-6 w-6 text-[var(--primary)]" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--gray-800)] truncate">{upload.fileName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-[var(--gray-500)]">{upload.child.name}</span>
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
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-[var(--gray-400)]">{formatDate(upload.uploadedAt)}</p>
                        </div>
                        {getStatusBadge(upload.analysisStatus)}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/dashboard/upload"
            className="group card-story p-8 text-center border-2 border-dashed border-[var(--gray-300)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center mb-4 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
              <Upload className="h-8 w-8 text-[var(--primary)] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {t.dashboard?.quickActions?.uploadNewTestTitle || 'Upload New Test'}
            </h3>
            <p className="text-sm text-[var(--gray-500)]">
              {t.dashboard?.quickActions?.uploadNewTestDesc || 'Upload a test image or PDF for AI-powered analysis'}
            </p>
          </Link>

          <Link
            href="/dashboard/children/new"
            className="group card-story p-8 text-center border-2 border-dashed border-[var(--gray-300)] hover:border-[var(--lavender)] hover:bg-[var(--lavender-soft)] transition-all"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--lavender-soft)] flex items-center justify-center mb-4 group-hover:bg-[var(--lavender)] group-hover:text-white transition-colors">
              <Users className="h-8 w-8 text-[var(--lavender)] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {t.dashboard?.quickActions?.addChildTitle || 'Add Child'}
            </h3>
            <p className="text-sm text-[var(--gray-500)]">
              {t.dashboard?.quickActions?.addChildDesc || "Register a new child to track their academic progress"}
            </p>
          </Link>
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, childId: null, childName: '' })}
          onConfirm={handleDeleteChild}
          loading={deleteLoading}
          title={t.common?.confirmDelete || 'Confirm Delete'}
          message={`${t.child?.confirmDeleteMessage || 'Are you sure you want to delete'} "${deleteModal.childName}"? ${t.child?.deleteWarning || 'This action cannot be undone and will delete all associated tests.'}`}
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
