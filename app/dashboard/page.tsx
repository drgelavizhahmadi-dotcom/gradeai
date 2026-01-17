'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'
import { Upload, FileText, Loader2, TrendingUp, Calendar, AlertCircle } from 'lucide-react'

interface Upload {
  id: string
  fileName: string
  uploadedAt: string
  analysisStatus: string
  child: {
    name: string
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch user's uploads from API
    // For now, show empty state
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-lg text-gray-600">
          Track and analyze your children's test results
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Uploads</p>
              <p className="text-2xl font-bold text-gray-900">{uploads.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Upload</p>
              <p className="text-sm font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Attention</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="rounded-xl bg-white p-6 shadow-md border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Uploads</h2>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload Test
          </Link>
        </div>

        {uploads.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No uploads yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by uploading your first test for AI analysis
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-5 w-5" />
              Upload Your First Test
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {uploads.map((upload) => (
              <Link
                key={upload.id}
                href={`/uploads/${upload.id}`}
                className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{upload.fileName}</p>
                      <p className="text-sm text-gray-600">{upload.child.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        upload.analysisStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : upload.analysisStatus === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : upload.analysisStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {upload.analysisStatus}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(upload.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/upload"
          className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload New Test</h3>
          <p className="text-sm text-gray-600">
            Upload a test image or PDF for AI-powered analysis
          </p>
        </Link>

        <Link
          href="/dashboard"
          className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-all group"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">View Progress</h3>
          <p className="text-sm text-gray-600">
            Track your children's academic performance over time
          </p>
        </Link>
      </div>
    </div>
  )
}
