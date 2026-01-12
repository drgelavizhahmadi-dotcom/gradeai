'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ArrowRight,
  FileText,
  Calendar
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import SkeletonCard from '@/components/SkeletonCard'
import EmptyState from '@/components/EmptyState'
import ErrorMessage from '@/components/ErrorMessage'

interface Child {
  id: string
  name: string
  grade: number
  schoolType: string
  createdAt: string
  _count?: {
    uploads: number
  }
}

export default function ChildrenPage() {
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      setError(null)
      const response = await fetch('/api/children')

      if (!response.ok) {
        throw new Error('Failed to load children. Please check your connection and try again.')
      }

      const data = await response.json()

      if (data.success) {
        setChildren(data.children)
      } else {
        throw new Error(data.error || 'Failed to load children')
      }
    } catch (err) {
      console.error('Error fetching children:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading children')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?\n\nThis will permanently delete:\n• Their profile\n• All test uploads\n• All analysis results\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/children/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setChildren(children.filter((child) => child.id !== id))
      } else {
        setError(data.error || 'Failed to delete child. Please try again.')
      }
    } catch (err) {
      console.error('Error deleting child:', err)
      setError('Failed to delete child. Please check your connection and try again.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mb-8">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-6 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <ErrorMessage
          title="Failed to Load Children"
          message={error}
          onRetry={fetchChildren}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Your Children</h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage your children's profiles and track their academic progress
            </p>
          </div>
          <Link
            href="/children/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Add Child
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6">
          <ErrorMessage
            variant="inline"
            title="Error"
            message={error}
            onRetry={() => setError(null)}
          />
        </div>
      )}

      {/* Children Grid */}
      {children.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No children added yet"
          description="Add your first child to start tracking their test results and academic progress"
          action={
            <Link
              href="/children/new"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Add Your First Child
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <div
              key={child.id}
              className="rounded-xl bg-white p-6 shadow-md border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              {/* Child Header */}
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
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Total Tests</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {child._count?.uploads || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Added</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(child.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/children/${child.id}`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  View Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => router.push(`/children/${child.id}/edit`)}
                  className="rounded-lg bg-gray-100 p-2.5 text-gray-700 hover:bg-gray-200 transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(child.id, child.name)}
                  disabled={deleting === child.id}
                  className="rounded-lg bg-red-50 p-2.5 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === child.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
