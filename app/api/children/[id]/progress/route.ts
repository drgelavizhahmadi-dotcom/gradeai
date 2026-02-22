import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: childId } = await params

    // Get user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get child with all uploads
    const child = await db.child.findFirst({
      where: {
        id: childId,
        userId: user.id,
      },
      include: {
        uploads: {
          where: {
            analysisStatus: 'completed',
          },
          orderBy: {
            uploadedAt: 'asc',
          },
        },
      },
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Process uploads to extract weaknesses and calculate progress
    const tests = child.uploads.map((upload: any) => {
      const analysis = upload.analysis as any

      // Extract weaknesses from analysis
      const weaknesses: string[] = []
      if (analysis?.weaknesses && Array.isArray(analysis.weaknesses)) {
        analysis.weaknesses.forEach((w: any) => {
          if (typeof w === 'string') {
            weaknesses.push(w)
          } else if (w.title) {
            weaknesses.push(w.title)
          }
        })
      }

      // Extract strengths
      const strengths: string[] = []
      if (analysis?.strengths && Array.isArray(analysis.strengths)) {
        analysis.strengths.forEach((s: any) => {
          if (typeof s === 'string') {
            strengths.push(s)
          } else if (s.title) {
            strengths.push(s.title)
          }
        })
      }

      return {
        id: upload.id,
        date: upload.uploadedAt.toISOString(),
        subject: upload.subject || analysis?.test?.subject || 'Unknown',
        grade: upload.grade,
        weaknesses,
        strengths,
      }
    })

    // Track weaknesses across all tests
    const weaknessMap = new Map<string, {
      name: string
      firstSeen: string
      lastSeen: string
      occurrences: number
      subjects: Set<string>
      testIndices: number[]
    }>()

    tests.forEach((test: any, index: number) => {
      test.weaknesses.forEach((weakness: string) => {
        const normalized = weakness.toLowerCase().trim()
        if (!weaknessMap.has(normalized)) {
          weaknessMap.set(normalized, {
            name: weakness,
            firstSeen: test.date,
            lastSeen: test.date,
            occurrences: 0,
            subjects: new Set(),
            testIndices: [],
          })
        }
        const entry = weaknessMap.get(normalized)!
        entry.occurrences++
        entry.lastSeen = test.date
        entry.subjects.add(test.subject)
        entry.testIndices.push(index)
      })
    })

    // Determine weakness status (resolved if not seen in last 2 tests, improving if decreasing)
    const weaknessTracking = Array.from(weaknessMap.values()).map((w: any) => {
      const lastTestIndex = tests.length - 1
      const maxIndex = Math.max(...(w.testIndices as number[]))

      let status: 'active' | 'improving' | 'resolved' = 'active'

      // If not seen in last 2 tests (and we have at least 2 tests), mark as resolved
      if (tests.length >= 2 && maxIndex < lastTestIndex - 1) {
        status = 'resolved'
      }
      // If seen in last test but frequency is decreasing, mark as improving
      else if (tests.length >= 3) {
        const recentCount = w.testIndices.filter((i: any) => i >= tests.length - 2).length
        const earlierCount = w.testIndices.filter((i: any) => i < tests.length - 2).length
        const recentRatio = recentCount / 2
        const earlierRatio = tests.length > 2 ? earlierCount / (tests.length - 2) : 1

        if (recentRatio < earlierRatio) {
          status = 'improving'
        }
      }

      return {
        name: w.name,
        firstSeen: w.firstSeen,
        lastSeen: w.lastSeen,
        occurrences: w.occurrences,
        status,
        subjects: Array.from(w.subjects),
      }
    }).sort((a: any, b: any) => {
      // Sort: active first, then improving, then resolved
      const order: Record<string, number> = { active: 0, improving: 1, resolved: 2 }
      return (order[a.status] ?? 3) - (order[b.status] ?? 3)
    })

    // Calculate stats
    const gradesArray = tests.map((t: any) => t.grade).filter((g: any): g is number => g !== null)
    const averageGrade = gradesArray.length > 0
      ? gradesArray.reduce((a: number, b: number) => a + b, 0) / gradesArray.length
      : null
    const bestGrade = gradesArray.length > 0 ? Math.min(...gradesArray) : null

    // Calculate trend (compare last 2 tests if available)
    let recentTrend: 'improving' | 'stable' | 'declining' | 'unknown' = 'unknown'
    let gradeChange: number | null = null

    if (gradesArray.length >= 2) {
      const lastGrade = gradesArray[gradesArray.length - 1]
      const prevGrade = gradesArray[gradesArray.length - 2]
      gradeChange = lastGrade - prevGrade

      if (gradeChange < -0.3) {
        recentTrend = 'improving' // Lower grade is better in German system
      } else if (gradeChange > 0.3) {
        recentTrend = 'declining'
      } else {
        recentTrend = 'stable'
      }
    }

    const resolvedWeaknesses = weaknessTracking.filter((w: any) => w.status === 'resolved').length
    const activeWeaknesses = weaknessTracking.filter((w: any) => w.status === 'active').length

    // Calculate subject breakdown
    const subjectMap = new Map<string, { grades: number[], testIndices: number[] }>()
    tests.forEach((test: any, index: number) => {
      if (!subjectMap.has(test.subject)) {
        subjectMap.set(test.subject, { grades: [], testIndices: [] })
      }
      const entry = subjectMap.get(test.subject)!
      if (test.grade !== null) {
        entry.grades.push(test.grade)
      }
      entry.testIndices.push(index)
    })

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => {
      const avgGrade = data.grades.length > 0
        ? data.grades.reduce((a: number, b: number) => a + b, 0) / data.grades.length
        : null

      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (data.grades.length >= 2) {
        const firstHalf = data.grades.slice(0, Math.ceil(data.grades.length / 2))
        const secondHalf = data.grades.slice(Math.ceil(data.grades.length / 2))
        const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length

        if (secondAvg < firstAvg - 0.3) {
          trend = 'up' // Lower is better
        } else if (secondAvg > firstAvg + 0.3) {
          trend = 'down'
        }
      }

      return {
        subject,
        count: data.testIndices.length,
        avgGrade,
        trend,
      }
    }).sort((a: any, b: any) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: {
        child: {
          id: child.id,
          name: child.name,
          grade: child.grade,
          schoolType: child.schoolType,
        },
        tests,
        weaknessTracking,
        stats: {
          totalTests: tests.length,
          averageGrade,
          bestGrade,
          recentTrend,
          gradeChange,
          resolvedWeaknesses,
          activeWeaknesses,
        },
        subjectBreakdown,
      },
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    )
  }
}
