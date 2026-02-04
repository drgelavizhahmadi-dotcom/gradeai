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
  Calendar,
  Star
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import Breadcrumbs from '@/components/Breadcrumbs'
import { CatMascot, CelebrationBanner } from '@/components/mascots'
import { GradeBadge } from '@/components/ui/GradeBadge'
import { SubjectTag } from '@/components/ui/SubjectTag'

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
  const [showCelebration, setShowCelebration] = useState(true)

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

  // Get mascot mood based on progress
  const getMascotMood = () => {
    if (!data) return 'thinking'
    if (data.stats.recentTrend === 'improving') return 'celebrating'
    if (data.stats.resolvedWeaknesses > 0) return 'happy'
    if (data.stats.recentTrend === 'declining') return 'encouraging'
    return 'happy'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <CatMascot mood="thinking" size="xl" message="Analyzing progress..." />
            <p className="text-[var(--gray-600)] font-medium mt-4">Gathering insights...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <div className="card-story p-12 text-center bg-white mt-6">
            <div className="flex justify-center mb-4">
              <CatMascot mood="encouraging" size="lg" message="Let me try again..." />
            </div>
            <h3 className="text-xl font-bold text-[var(--gray-800)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Failed to load progress
            </h3>
            <p className="text-[var(--gray-600)] mb-6">{error}</p>
            <button
              onClick={fetchProgressData}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { child, tests, weaknessTracking, stats, subjectBreakdown } = data

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs />

        {/* Header */}
        <div className="mb-8 mt-6">
          <Link
            href={`/dashboard/children/${childId}`}
            className="inline-flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary-dark)] mb-4 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>

          <div className="bg-gradient-to-br from-[var(--lavender-soft)] to-[var(--primary-soft)] rounded-3xl p-8 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="hidden sm:block">
                <CatMascot
                  mood={getMascotMood()}
                  size="lg"
                  message={stats.recentTrend === 'improving' ? `${child.name} is doing amazing!` : `Let's see ${child.name}'s journey!`}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
                  Progress Dashboard
                </h1>
                <p className="text-lg text-[var(--gray-600)]">{child.name}'s learning journey</p>
              </div>
            </div>
            {/* Decorative */}
            <div className="absolute top-4 right-8 text-4xl opacity-20">📈</div>
            <div className="absolute bottom-4 right-24 text-3xl opacity-20">⭐</div>
          </div>
        </div>

        {/* Celebration Banner */}
        {showCelebration && stats.recentTrend === 'improving' && stats.resolvedWeaknesses > 0 && (
          <div className="mb-8">
            <CelebrationBanner
              mascotType="cat"
              title="Amazing Progress!"
              subtitle={`${child.name} has resolved ${stats.resolvedWeaknesses} weakness${stats.resolvedWeaknesses > 1 ? 'es' : ''} and is showing improvement!`}
              onClose={() => setShowCelebration(false)}
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Average Grade */}
          <div className="card-story p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">Average Grade</p>
                <div className="mt-2">
                  <GradeBadge grade={stats.averageGrade} size="lg" showLabel />
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--primary-soft)]">
                <Target className="h-6 w-6 text-[var(--primary)]" />
              </div>
            </div>
          </div>

          {/* Trend */}
          <div className="card-story p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">Recent Trend</p>
                <p className={`text-xl font-bold mt-2 ${
                  stats.recentTrend === 'improving' ? 'text-[var(--success)]' :
                  stats.recentTrend === 'declining' ? 'text-[var(--error)]' : 'text-[var(--gray-600)]'
                }`} style={{ fontFamily: 'var(--font-display)' }}>
                  {stats.recentTrend === 'improving' ? '🚀 Improving!' :
                   stats.recentTrend === 'declining' ? 'Needs Focus' :
                   stats.recentTrend === 'stable' ? '➡️ Stable' : 'Not enough data'}
                </p>
                {stats.gradeChange !== null && (
                  <p className={`text-sm ${stats.gradeChange < 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                    {stats.gradeChange < 0 ? '' : '+'}{stats.gradeChange.toFixed(1)} vs last test
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-2xl ${
                stats.recentTrend === 'improving' ? 'bg-[var(--success-soft)]' :
                stats.recentTrend === 'declining' ? 'bg-[var(--error-soft)]' : 'bg-[var(--gray-100)]'
              }`}>
                {stats.recentTrend === 'improving' ? (
                  <TrendingUp className="h-6 w-6 text-[var(--success)]" />
                ) : stats.recentTrend === 'declining' ? (
                  <TrendingDown className="h-6 w-6 text-[var(--error)]" />
                ) : (
                  <Target className="h-6 w-6 text-[var(--gray-500)]" />
                )}
              </div>
            </div>
          </div>

          {/* Resolved Weaknesses */}
          <div className="card-story p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">Weaknesses Resolved</p>
                <p className="text-3xl font-bold text-[var(--success)] mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {stats.resolvedWeaknesses}
                </p>
                <p className="text-sm text-[var(--gray-400)]">{stats.activeWeaknesses} still active</p>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--success-soft)]">
                <CheckCircle className="h-6 w-6 text-[var(--success)]" />
              </div>
            </div>
          </div>

          {/* Best Grade */}
          <div className="card-story p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--gray-500)]">Best Grade</p>
                <div className="mt-2">
                  <GradeBadge grade={stats.bestGrade} size="lg" />
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--gold-soft)]">
                <Award className="h-6 w-6 text-[var(--gold-dark)]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Grade History Chart */}
          <div className="card-story p-6 bg-white">
            <h3 className="text-lg font-bold text-[var(--gray-800)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
              Grade History
            </h3>
            {tests.length === 0 ? (
              <div className="text-center py-8">
                <CatMascot mood="encouraging" size="md" message="Upload tests to see progress!" showMessage={false} />
                <p className="text-[var(--gray-500)] mt-4">No tests uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visual chart */}
                <div className="relative h-48 flex items-end gap-2">
                  {tests.slice(-10).map((test, i) => {
                    const grade = test.grade || 6
                    const height = ((6 - grade) / 5) * 100
                    const gradeClass = `grade-${Math.min(6, Math.max(1, Math.round(grade)))}`
                    return (
                      <div key={test.id} className="flex-1 flex flex-col items-center group">
                        <div
                          className={`w-full rounded-t-xl transition-all cursor-pointer ${gradeClass} hover:opacity-80`}
                          style={{ height: `${Math.max(height, 15)}%` }}
                          title={`${test.subject}: ${grade}`}
                        >
                          <span className="text-xs font-bold block text-center pt-2 text-white">
                            {grade.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--gray-400)] mt-2 truncate w-full text-center">
                          {new Date(test.date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {/* Grade scale reference */}
                <div className="flex justify-between text-xs text-[var(--gray-400)] border-t border-[var(--gray-200)] pt-2">
                  <span>1 (Best)</span>
                  <span>6 (Worst)</span>
                </div>
              </div>
            )}
          </div>

          {/* Subject Breakdown */}
          <div className="card-story p-6 bg-white">
            <h3 className="text-lg font-bold text-[var(--gray-800)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <BookOpen className="h-5 w-5 text-[var(--lavender)]" />
              By Subject
            </h3>
            {subjectBreakdown.length === 0 ? (
              <div className="text-center py-8 text-[var(--gray-500)]">
                <p>No subject data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjectBreakdown.map((subject) => (
                  <div key={subject.subject} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--gray-50)] hover:bg-[var(--gray-100)] transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <SubjectTag subject={subject.subject} size="sm" />
                        <GradeBadge grade={subject.avgGrade} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-[var(--gray-500)]">{subject.count} test{subject.count > 1 ? 's' : ''}</span>
                        {subject.trend === 'up' && (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--success)] font-medium">
                            <TrendingUp className="h-3 w-3" /> Improving
                          </span>
                        )}
                        {subject.trend === 'down' && (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--error)] font-medium">
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
        <div className="mt-8 card-story p-6 bg-white">
          <h3 className="text-lg font-bold text-[var(--gray-800)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Target className="h-5 w-5 text-[var(--coral)]" />
            Weakness Tracker
          </h3>
          {weaknessTracking.length === 0 ? (
            <div className="text-center py-8">
              <CatMascot mood="happy" size="md" message="No weaknesses found yet!" showMessage={false} />
              <p className="text-[var(--gray-500)] mt-4">Upload more tests to start tracking progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {weaknessTracking.map((weakness, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    weakness.status === 'resolved' ? 'bg-[var(--success-soft)] border-[var(--success)]' :
                    weakness.status === 'improving' ? 'bg-[var(--warning-soft)] border-[var(--warning)]' :
                    'bg-[var(--error-soft)] border-[var(--error)]'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${
                    weakness.status === 'resolved' ? 'bg-[var(--success)]' :
                    weakness.status === 'improving' ? 'bg-[var(--warning)]' :
                    'bg-[var(--error)]'
                  }`}>
                    {weakness.status === 'resolved' ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : weakness.status === 'improving' ? (
                      <TrendingUp className="h-5 w-5 text-white" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--gray-800)]">{weakness.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        weakness.status === 'resolved' ? 'bg-[var(--success)] text-white' :
                        weakness.status === 'improving' ? 'bg-[var(--warning)] text-white' :
                        'bg-[var(--error)] text-white'
                      }`}>
                        {weakness.status === 'resolved' ? '✓ Resolved!' :
                         weakness.status === 'improving' ? '↗ Improving' : '⚠ Active'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[var(--gray-500)]">
                      <span>Seen {weakness.occurrences}x</span>
                      <span>•</span>
                      <span>In: {weakness.subjects.join(', ')}</span>
                    </div>
                  </div>
                  {weakness.status === 'resolved' && (
                    <Star className="h-6 w-6 text-[var(--gold)] animate-sparkle" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tests Timeline */}
        <div className="mt-8 card-story p-6 bg-white">
          <h3 className="text-lg font-bold text-[var(--gray-800)] mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Calendar className="h-5 w-5 text-[var(--primary)]" />
            Recent Tests
          </h3>
          {tests.length === 0 ? (
            <div className="text-center py-8 text-[var(--gray-500)]">
              <p>No tests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tests.slice(-5).reverse().map((test) => (
                <Link
                  key={test.id}
                  href={`/uploads/${test.id}`}
                  className="block p-4 rounded-xl border-2 border-[var(--gray-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SubjectTag subject={test.subject} size="sm" />
                      <span className="text-sm text-[var(--gray-500)]">
                        {new Date(test.date).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <GradeBadge grade={test.grade} size="md" />
                  </div>
                  {test.weaknesses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {test.weaknesses.slice(0, 3).map((w, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-[var(--coral-soft)] text-[var(--coral-dark)] rounded-lg">
                          {w}
                        </span>
                      ))}
                      {test.weaknesses.length > 3 && (
                        <span className="text-xs text-[var(--gray-400)]">+{test.weaknesses.length - 3} more</span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
