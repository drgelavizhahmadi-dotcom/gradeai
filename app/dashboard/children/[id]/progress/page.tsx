'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Calendar
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import Breadcrumbs from '@/components/Breadcrumbs'
import LoadingSpinner from '@/components/LoadingSpinner'

interface TestData {
  id: string
  date: string
  subject: string
  grade: number | null
  weaknesses: string[]
  strengths: string[]
}

interface WeaknessTrack {
  name: string
  firstSeen: string
  lastSeen: string
  occurrences: number
  status: 'active' | 'improving' | 'resolved'
  subjects: string[]
}

interface ProgressData {
  child: {
    id: string
    name: string
    grade: number
    schoolType: string
  }
  tests: TestData[]
  weaknessTracking: WeaknessTrack[]
  stats: {
    totalTests: number
    averageGrade: number | null
    bestGrade: number | null
    recentTrend: 'improving' | 'stable' | 'declining' | 'unknown'
    gradeChange: number | null
    resolvedWeaknesses: number
    activeWeaknesses: number
  }
  subjectBreakdown: {
    subject: string
    count: number
    avgGrade: number | null
    trend: 'up' | 'down' | 'stable'
  }[]
}

export default function ProgressPage() {
  const params = useParams()
  const { t } = useLanguage()
  const childId = params.id as string

  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (childId) {
      fetchProgressData()
    }
  }, [childId])

  const fetchProgressData = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/children/${childId}/progress`)

      if (!response.ok) {
        throw new Error('Failed to load progress data')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to load progress')
      }
    } catch (err) {
      console.error('Error fetching progress:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: number): string => {
    if (grade <= 1.5) return 'text-green-600'
    if (grade <= 2.5) return 'text-emerald-600'
    if (grade <= 3.5) return 'text-yellow-600'
    if (grade <= 4.5) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeBg = (grade: number): string => {
    if (grade <= 1.5) return 'bg-green-100 border-green-300'
    if (grade <= 2.5) return 'bg-emerald-100 border-emerald-300'
    if (grade <= 3.5) return 'bg-yellow-100 border-yellow-300'
    if (grade <= 4.5) return 'bg-orange-100 border-orange-300'
    return 'bg-red-100 border-red-300'
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <LoadingSpinner size="lg" text="Loading progress data..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Failed to load progress</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={fetchProgressData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const { child, tests, weaknessTracking, stats, subjectBreakdown } = data

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs />

      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/children/${childId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 p-4">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Progress Dashboard</h1>
            <p className="text-lg text-gray-600">{child.name}'s learning journey</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Average Grade */}
        <div className="rounded-xl bg-white border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className={`text-3xl font-bold ${stats.averageGrade ? getGradeColor(stats.averageGrade) : 'text-gray-400'}`}>
                {stats.averageGrade ? stats.averageGrade.toFixed(1) : '-'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stats.averageGrade ? getGradeBg(stats.averageGrade) : 'bg-gray-100'}`}>
              <Target className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Trend */}
        <div className="rounded-xl bg-white border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Trend</p>
              <p className={`text-xl font-bold ${
                stats.recentTrend === 'improving' ? 'text-green-600' :
                stats.recentTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stats.recentTrend === 'improving' ? 'Improving!' :
                 stats.recentTrend === 'declining' ? 'Needs Focus' :
                 stats.recentTrend === 'stable' ? 'Stable' : 'Not enough data'}
              </p>
              {stats.gradeChange !== null && (
                <p className={`text-sm ${stats.gradeChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.gradeChange < 0 ? '' : '+'}{stats.gradeChange.toFixed(1)} vs last test
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full ${
              stats.recentTrend === 'improving' ? 'bg-green-100' :
              stats.recentTrend === 'declining' ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {stats.recentTrend === 'improving' ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : stats.recentTrend === 'declining' ? (
                <TrendingDown className="h-6 w-6 text-red-600" />
              ) : (
                <Target className="h-6 w-6 text-gray-600" />
              )}
            </div>
          </div>
        </div>

        {/* Resolved Weaknesses */}
        <div className="rounded-xl bg-white border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weaknesses Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats.resolvedWeaknesses}</p>
              <p className="text-sm text-gray-500">{stats.activeWeaknesses} still active</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Best Grade */}
        <div className="rounded-xl bg-white border-2 border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Best Grade</p>
              <p className={`text-3xl font-bold ${stats.bestGrade ? getGradeColor(stats.bestGrade) : 'text-gray-400'}`}>
                {stats.bestGrade ? stats.bestGrade.toFixed(1) : '-'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Banner */}
      {stats.recentTrend === 'improving' && stats.resolvedWeaknesses > 0 && (
        <div className="mb-8 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <Sparkles className="h-10 w-10" />
            <div>
              <h3 className="text-xl font-bold">Great Progress!</h3>
              <p className="text-green-100">
                {child.name} has resolved {stats.resolvedWeaknesses} weakness{stats.resolvedWeaknesses > 1 ? 'es' : ''} and is showing improvement!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Grade History Chart */}
        <div className="rounded-xl bg-white border-2 border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Grade History
          </h3>
          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tests uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Simple visual chart */}
              <div className="relative h-48 flex items-end gap-2">
                {tests.slice(-10).map((test, i) => {
                  const grade = test.grade || 6
                  const height = ((6 - grade) / 5) * 100 // Convert grade to height percentage (1=100%, 6=0%)
                  return (
                    <div key={test.id} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t-lg transition-all ${getGradeBg(grade)} border-2`}
                        style={{ height: `${Math.max(height, 10)}%` }}
                        title={`${test.subject}: ${grade}`}
                      >
                        <span className="text-xs font-bold block text-center pt-1">
                          {grade.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                        {new Date(test.date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Grade scale reference */}
              <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
                <span>1 (Best)</span>
                <span>6 (Worst)</span>
              </div>
            </div>
          )}
        </div>

        {/* Subject Breakdown */}
        <div className="rounded-xl bg-white border-2 border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            By Subject
          </h3>
          {subjectBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No subject data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjectBreakdown.map((subject) => (
                <div key={subject.subject} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{subject.subject}</span>
                      <span className={`font-bold ${subject.avgGrade ? getGradeColor(subject.avgGrade) : 'text-gray-400'}`}>
                        {subject.avgGrade ? subject.avgGrade.toFixed(1) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">{subject.count} test{subject.count > 1 ? 's' : ''}</span>
                      {subject.trend === 'up' && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <TrendingUp className="h-3 w-3" /> Improving
                        </span>
                      )}
                      {subject.trend === 'down' && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <TrendingDown className="h-3 w-3" /> Declining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weakness Tracker */}
      <div className="mt-8 rounded-xl bg-white border-2 border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-600" />
          Weakness Tracker
        </h3>
        {weaknessTracking.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No weaknesses tracked yet</p>
            <p className="text-sm">Upload more tests to start tracking progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weaknessTracking.map((weakness, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                  weakness.status === 'resolved' ? 'bg-green-50 border-green-200' :
                  weakness.status === 'improving' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  weakness.status === 'resolved' ? 'bg-green-100' :
                  weakness.status === 'improving' ? 'bg-yellow-100' :
                  'bg-red-100'
                }`}>
                  {weakness.status === 'resolved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : weakness.status === 'improving' ? (
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{weakness.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      weakness.status === 'resolved' ? 'bg-green-200 text-green-800' :
                      weakness.status === 'improving' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {weakness.status === 'resolved' ? 'Resolved!' :
                       weakness.status === 'improving' ? 'Improving' : 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Seen {weakness.occurrences}x</span>
                    <span>•</span>
                    <span>In: {weakness.subjects.join(', ')}</span>
                  </div>
                </div>
                {weakness.status === 'resolved' && (
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Tests Timeline */}
      <div className="mt-8 rounded-xl bg-white border-2 border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Recent Tests
        </h3>
        {tests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.slice(-5).reverse().map((test) => (
              <Link
                key={test.id}
                href={`/uploads/${test.id}`}
                className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{test.subject}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {new Date(test.date).toLocaleDateString('de-DE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {test.grade && (
                    <span className={`text-xl font-bold ${getGradeColor(test.grade)}`}>
                      {test.grade.toFixed(1)}
                    </span>
                  )}
                </div>
                {test.weaknesses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {test.weaknesses.slice(0, 3).map((w, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                        {w}
                      </span>
                    ))}
                    {test.weaknesses.length > 3 && (
                      <span className="text-xs text-gray-500">+{test.weaknesses.length - 3} more</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
