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
  Calendar,
  ArrowRight,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'

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

      // Fetch children with their stats
      const childrenResponse = await fetch('/api/children')
      const childrenData = await childrenResponse.json()

      if (childrenData.children) {
        // Calculate stats for each child
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

        // Flatten all uploads for recent activity
        const allUploads = childrenData.children.flatMap((child: any) => 
          (child.uploads || []).map((upload: any) => ({
            ...upload,
            child: { name: child.name }
          }))
        )

        // Sort by date and take the 5 most recent
        const sortedUploads = allUploads.sort((a: any, b: any) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
        setRecentUploads(sortedUploads.slice(0, 5))

        // Calculate overall stats
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 border border-green-200">
            <CheckCircle className="h-3.5 w-3.5" />
            {statusText.completed}
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {statusText.processing}
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5" />
            {statusText.failed}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 border border-yellow-200">
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

  const getGradeColor = (grade: number): string => {
    if (grade <= 2.0) return 'text-green-700 bg-green-50 border-green-200'
    if (grade <= 3.0) return 'text-blue-700 bg-blue-50 border-blue-200'
    if (grade <= 4.0) return 'text-amber-700 bg-amber-50 border-amber-200'
    return 'text-red-700 bg-red-50 border-red-200'
  }

  const handleDeleteChild = async () => {
    if (!deleteModal.childId) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/children/${deleteModal.childId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh dashboard data
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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-2">
          {t.dashboard?.welcome || 'Welcome back!'} 👋
        </h1>
        <p className="text-lg text-gray-600">
          {t.dashboard?.totalTests || 'Track and analyze your children\'s test results with AI-powered insights'}
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Tests */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-blue-600 p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">{t.dashboard?.totalTests || 'Total Tests'}</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalTests}</p>
            </div>
          </div>
          <p className="text-xs text-blue-700">{t.dashboard?.noTests || 'All time uploads'}</p>
        </div>

        {/* Pending Analysis */}
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 border-2 border-amber-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-amber-600 p-3">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">{t.child?.pending || 'Pending'}</p>
              <p className="text-3xl font-bold text-amber-900">{stats.pendingTests}</p>
            </div>
          </div>
          <p className="text-xs text-amber-700">{t.upload?.processing || 'Awaiting analysis'}</p>
        </div>

        {/* Average Grade */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 border-2 border-emerald-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-emerald-600 p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-900">{t.dashboard?.averageGrade || 'Avg. Grade'}</p>
              <p className="text-3xl font-bold text-emerald-900">
                {stats.averageGrade?.toFixed(1) || '-'}
              </p>
            </div>
          </div>
          <p className="text-xs text-emerald-700">{t.upload?.subject || 'Across all tests'}</p>
        </div>

        {/* Children */}
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-purple-600 p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">{t.dashboard?.totalChildren || 'Children'}</p>
              <p className="text-3xl font-bold text-purple-900">{children.length}</p>
            </div>
          </div>
          <p className="text-xs text-purple-700">{t.child?.profile || 'Registered students'}</p>
        </div>
      </div>

      {/* Children Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t.nav?.children || 'Your Children'}</h2>
          <Link
            href="/dashboard/children/new"
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t.child?.addNew || 'Add Child'}
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <div
              key={child.id}
              className="rounded-xl bg-white p-6 shadow-md border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-3">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-600">
                      Grade {child.grade} • {child.schoolType}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/children/${child.id}/edit`}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                    title={t.common?.edit || 'Edit'}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, childId: child.id, childName: child.name })}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors"
                    title={t.common?.delete || 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t.child?.totalTests || 'Total Tests'}</span>
                  <span className="text-sm font-semibold text-gray-900">{child.totalTests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Grade</span>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${
                    child.averageGrade ? getGradeColor(child.averageGrade) : 'text-gray-600 bg-gray-50 border-gray-200'
                  }`}>
                    {child.averageGrade?.toFixed(1) || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Test</span>
                  <span className="text-xs text-gray-500">
                    {child.lastTestDate ? formatDate(child.lastTestDate) : 'Never'}
                  </span>
                </div>
              </div>

              <Link
                href={`/dashboard/children/${child.id}`}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                View Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">{t.dashboard?.recentUploads || 'Recent Uploads'}</h2>
            {recentUploads.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUploads.size === recentUploads.length && recentUploads.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t.common?.selectAll || 'Select All'}</span>
              </label>
            )}
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            {t.common?.filter || 'View All'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedUploads.size > 0 && (
          <div className="mb-4 rounded-lg bg-blue-50 border-2 border-blue-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{selectedUploads.size}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedUploads.size} {selectedUploads.size === 1 ? (t.upload?.selected || 'test selected') : (t.upload?.selectedPlural || 'tests selected')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedUploads(new Set())}
                className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                {t.common?.cancel || 'Cancel'}
              </button>
              <button
                onClick={() => setBulkDeleteModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t.common?.delete || 'Delete'}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white shadow-md border border-gray-200 overflow-hidden">
          {recentUploads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.dashboard?.noTests || 'No uploads yet'}</h3>
              <p className="text-gray-600 mb-6">
                {t.dashboard?.noTestsDesc || 'Get started by uploading your first test for AI analysis'}
              </p>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-5 w-5" />
                {t.upload?.title || 'Upload Your First Test'}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-3 p-5 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedUploads.has(upload.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleSelectUpload(upload.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <Link
                    href={`/uploads/${upload.id}`}
                    className="flex items-center justify-between gap-4 flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{upload.fileName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{upload.child.name}</span>
                          {upload.grade && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className={`text-sm font-bold px-2 py-0.5 rounded border ${getGradeColor(upload.grade)}`}>
                                {upload.grade.toFixed(1)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">{formatDate(upload.uploadedAt)}</p>
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/upload"
          className="group rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Upload className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t.dashboard?.quickActions?.uploadNewTestTitle || 'Upload New Test'}</h3>
          <p className="text-sm text-gray-600">
            {t.dashboard?.quickActions?.uploadNewTestDesc || 'Upload a test image or PDF for AI-powered analysis'}
          </p>
        </Link>

        <Link
          href="/dashboard/children/new"
          className="group rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-all"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
            <Users className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t.dashboard?.quickActions?.addChildTitle || 'Add Child'}</h3>
          <p className="text-sm text-gray-600">
            {t.dashboard?.quickActions?.addChildDesc || 'Register a new child to track their academic progress'}
          </p>
        </Link>

        <Link
          href="/dashboard"
          className="group rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-emerald-500 hover:bg-emerald-50 transition-all"
        >
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
            <BarChart3 className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t.dashboard?.quickActions?.viewAnalyticsTitle || 'View Analytics'}</h3>
          <p className="text-sm text-gray-600">
            {t.dashboard?.quickActions?.viewAnalyticsDesc || 'Track performance trends and insights over time'}
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
  )
}
