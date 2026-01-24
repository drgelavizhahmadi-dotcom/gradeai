'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  GraduationCap,
  FileText,
  TrendingUp,
  Edit,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Pencil,
  Trash2
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import Breadcrumbs from '@/components/Breadcrumbs'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'

interface Child {
  id: string
  name: string
  grade: number
  schoolType: string
  createdAt: string
}

interface Upload {
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
  const [uploads, setUploads] = useState<Upload[]>([])
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

        // Calculate stats from uploads
        const uploads = childData.child.uploads || []
        const completed = uploads.filter((u: Upload) => u.analysisStatus === 'completed')
        const gradesArray = completed.map((u: Upload) => u.grade).filter((g: number | null) => g !== null)

        setStats({
          totalTests: uploads.length,
          averageGrade: gradesArray.length > 0 ? gradesArray.reduce((a: number, b: number) => a + b, 0) / gradesArray.length : null,
          completedTests: completed.length,
          pendingTests: uploads.filter((u: Upload) => u.analysisStatus === 'pending' || u.analysisStatus === 'processing').length,
        })

        setUploads(uploads)
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 border border-green-200">
            <CheckCircle className="h-3.5 w-3.5" />
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Processing
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 border border-yellow-200">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        )
    }
  }

  const getGradeColor = (grade: number): string => {
    if (grade <= 2.0) return 'text-green-700 bg-green-50 border-green-200'
    if (grade <= 3.0) return 'text-blue-700 bg-blue-50 border-blue-200'
    if (grade <= 4.0) return 'text-amber-700 bg-amber-50 border-amber-200'
    return 'text-red-700 bg-red-50 border-red-200'
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <LoadingSpinner size="lg" text="Loading child profile..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <ErrorMessage
          title="Failed to Load Profile"
          message={error}
          onRetry={fetchChildData}
        />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <EmptyState
          icon={AlertCircle}
          iconColor="text-red-600"
          title="Child Not Found"
          description="The child profile you're looking for doesn't exist or may have been deleted."
          action={
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              Back to Dashboard
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{child.name}</h1>
              <p className="text-lg text-gray-600">
                Grade {child.grade} • {child.schoolType}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/children/${child.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              {t.common?.edit || 'Edit Profile'}
            </Link>
            <button
              onClick={() => setDeleteModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {t.common?.delete || 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Total Tests</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalTests}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 border-2 border-emerald-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-900">Avg. Grade</p>
              <p className="text-3xl font-bold text-emerald-900">
                {stats.averageGrade ? stats.averageGrade.toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">{t.child?.completed || 'Completed'}</p>
              <p className="text-3xl font-bold text-green-900">{stats.completedTests}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-6 border-2 border-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">{t.child?.pending || 'Pending'}</p>
              <p className="text-3xl font-bold text-amber-900">{stats.pendingTests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="mb-8">
        <Link
          href={`/dashboard/upload?childId=${child.id}`}
          className="block rounded-xl border-2 border-dashed border-blue-300 p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t.child?.uploadNewTest || 'Upload New Test'}</h3>
          <p className="text-sm text-gray-600">
            {(t.child?.uploadForChild || 'Upload a test for {name} to get AI-powered analysis').replace('{name}', child.name)}
          </p>
        </Link>
      </div>

      {/* Test History */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">{t.child?.testHistory || 'Test History'}</h2>
            {uploads.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUploads.size === uploads.length && uploads.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t.common?.selectAll || 'Select All'}</span>
              </label>
            )}
          </div>
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

        {uploads.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No tests uploaded yet"
            description={`Upload ${child.name}'s first test to start tracking their progress and get AI-powered insights`}
            action={
              <Link
                href={`/dashboard/upload?childId=${child.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Upload className="h-5 w-5" />
                Upload First Test
              </Link>
            }
          />
        ) : (
          <div className="rounded-xl bg-white shadow-md border border-gray-200 overflow-hidden divide-y divide-gray-200">
            {uploads.map((upload) => (
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
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{upload.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">
                        {new Date(upload.uploadedAt).toLocaleDateString()}
                      </span>
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
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {new Date(upload.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {getStatusBadge(upload.analysisStatus)}
                  </div>
                </Link>
              </div>
            ))}
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
  )
}
