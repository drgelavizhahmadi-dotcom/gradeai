"use client"

import React from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Props {
  analysis: any
}

export default function ComprehensiveAnalysis({ analysis }: Props) {
  const { t } = useLanguage()
  const meta = analysis?.metadata || {}
  const ev = meta.visualEvidence || null

  const aiConfidence = Math.round((analysis?.summary?.confidence ?? 0.85) * 100)
  const ocrConfidence = Math.round((meta?.ocrConfidence ?? 0.85) * 100)
  const consensusScore = Math.round(meta.consensusScore ?? 0)

  const aiProviderCount = Array.isArray(meta.providers)
    ? meta.providers.length
    : (String(meta.aiModel || '').split(',').filter(Boolean).length || 1)

  const aiProviders = Array.isArray(meta.providers)
    ? meta.providers.join(', ')
    : (meta.aiModel || 'Multi-AI')

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {analysis?.summary?.subject || t.upload?.subject || 'Unbekanntes Fach'}
            </h2>
            <p className="text-gray-600">
              {t.analysis?.detectedGrade || 'Gesamtnote'}: <span className="font-semibold">{analysis?.summary?.overallGrade || '-'}</span>
              {typeof analysis?.summary?.percentage === 'number' && (
                <span className="ml-2">({Math.round(analysis.summary.percentage)}%)</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{t.analysis?.ocrConfidence || 'KI-Vertrauen'}: {aiConfidence}%</p>
            <p className="text-sm text-gray-500">OCR: {ocrConfidence}%</p>
          </div>
        </div>
      </div>

      {/* How it was analyzed */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.analysis?.howAnalyzed || 'So wurde analysiert'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">{t.analysis?.aiExperts || 'KI-Experten'}</p>
            <p className="text-xl font-bold text-gray-900">{aiProviderCount}</p>
            <p className="text-xs text-gray-500 mt-1">{aiProviders}</p>
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">{t.analysis?.consensusScore || 'Consensus-Score'}</p>
            <p className="text-xl font-bold text-gray-900">{consensusScore}%</p>
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">{t.analysis?.visualEvidence || 'Visuelle Evidenz'}</p>
            <p className="text-xl font-bold text-gray-900">{ev ? Math.round((ev.confidence || 0) * 100) : 0}%</p>
          </div>
          <div className="rounded border p-4">
            <p className="text-sm text-gray-600">{t.analysis?.extractedText || 'OCR-Textlänge'}</p>
            <p className="text-xl font-bold text-gray-900">{meta.rawOcrTextLength ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Visual evidence */}
      {ev && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.analysis?.visualEvidence || 'Visuelle Evidenz'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded border p-4">
              <p className="text-sm text-gray-600">{t.analysis?.detectedGrade || 'Erkannte Note'}</p>
              <p className="text-xl font-bold text-gray-900">{ev.grade_detected ?? '—'}</p>
            </div>
            <div className="rounded border p-4">
              <p className="text-sm text-gray-600">{t.analysis?.points || 'Punkte'}</p>
              <p className="text-xl font-bold text-gray-900">{ev.points ?? '—'}</p>
            </div>
            <div className="rounded border p-4">
              <p className="text-sm text-gray-600">{t.analysis?.correctionDensity || 'Korrekturdichte'}</p>
              <p className="text-xl font-bold text-gray-900">{Math.round((ev.correction_density || 0) * 100)}%</p>
            </div>
            <div className="rounded border p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-gray-600">{t.analysis?.teacherComment || 'Lehrkraft-Kommentare'}</p>
              <p className="text-gray-900">{ev.teacher_comment || '—'}</p>
            </div>
            <div className="rounded border p-4 lg:col-span-3">
              <p className="text-sm text-gray-600 mb-2">{t.analysis?.marks || 'Markierungen'}</p>
              <div className="flex gap-2 flex-wrap">
                {(ev.marks || []).length > 0 ? (
                  (ev.marks || []).map((m: string, i: number) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">{m}</span>
                  ))
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.analysis?.strengths || 'Stärken'}</h3>
          <ul className="list-disc ml-5 space-y-1">
            {(analysis.strengths || []).map((s: string, idx: number) => (
              <li key={idx} className="text-gray-800">{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.analysis?.weaknesses || 'Verbesserungsfelder'}</h3>
          <ul className="list-disc ml-5 space-y-1">
            {(analysis.weaknesses || []).map((w: string, idx: number) => (
              <li key={idx} className="text-gray-800">{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{t.analysis?.recommendations || 'Empfehlungen'}</h3>
        <div className="space-y-2">
          {(analysis.recommendations || []).map((r: any, idx: number) => (
            <div key={idx} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{r.action}</p>
                <span className="text-xs text-gray-500">{(t.analysis?.priority || 'Priorität')} {r.priority ?? '-'} · {(t.analysis?.timeframe || 'Zeitrahmen')} {r.timeframe ?? ''}</span>
              </div>
              {r.rationale && <p className="text-gray-700 mt-1">{r.rationale}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

