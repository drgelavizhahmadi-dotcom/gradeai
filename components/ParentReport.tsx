'use client';

import { useState } from 'react';

interface ReportData {
  student?: { name?: string; class?: string };
  test?: { subject?: string; date?: string; topic?: string };
  grade?: { 
    value?: string; 
    description?: string; 
    percentage?: number; 
    points?: string;
    breakdown?: Array<{ category: string; points: string; maxPoints?: string }>;
  };
  teacherFeedback?: {
    mainComment?: string;
    marginNotes?: string[];
    correctionCount?: Record<string, string>;
  };
  strengths?: Array<{ point: string; evidence?: string } | string>;
  weaknesses?: Array<{ point: string; teacherNote?: string; severity?: string } | string>;
  recommendations?: Array<{ action: string; timeframe?: string; priority?: string } | string>;
  summary?: string;
}

interface ParentReportProps {
  data: ReportData;
  extractedText?: string | null;
  childName?: string;
}

export function ParentReport({ data, extractedText, childName }: ParentReportProps) {
  const [showRaw, setShowRaw] = useState(false);

  // If no structured data, try to parse from extractedText
  const reportData = data || {};
  
  const studentName = reportData.student?.name || childName || 'Schüler/in';
  const grade = reportData.grade?.value || '—';
  const gradeDesc = reportData.grade?.description || getGradeDescription(grade);
  const subject = reportData.test?.subject || 'Unbekannt';
  const percentage = reportData.grade?.percentage || calculatePercentage(grade);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold">Elternbericht - {subject}</h1>
        <p className="text-blue-100 mt-1">Schüler/in: {studentName}</p>
        {reportData.test?.date && (
          <p className="text-blue-200 text-sm">Datum: {reportData.test.date}</p>
        )}
      </div>

      {/* Grade Card */}
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">📊 Gesamtnote</h2>
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-bold text-blue-600">{grade}</span>
          {gradeDesc && (
            <span className="text-xl text-gray-500">({gradeDesc})</span>
          )}
          {percentage && (
            <span className="text-lg text-gray-400">• {percentage}%</span>
          )}
        </div>
        
        {/* Points Breakdown */}
        {reportData.grade?.breakdown && reportData.grade.breakdown.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-600 mb-2">Punkteverteilung:</p>
            <div className="space-y-1">
              {reportData.grade.breakdown.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="font-medium">{item.points}{item.maxPoints ? ` / ${item.maxPoints}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Teacher Comment */}
      {reportData.teacherFeedback?.mainComment && (
        <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">💬 Lehrerkommentar</h2>
          <p className="text-gray-700 italic leading-relaxed">
            "{reportData.teacherFeedback.mainComment}"
          </p>
        </div>
      )}

      {/* Strengths */}
      {reportData.strengths && reportData.strengths.length > 0 && (
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-green-700 mb-3">✅ Stärken</h2>
          <ul className="space-y-2">
            {reportData.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span className="text-gray-700">
                  {typeof s === 'string' ? s : s.point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {reportData.weaknesses && reportData.weaknesses.length > 0 && (
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700 mb-3">⚠️ Verbesserungsfelder</h2>
          <ul className="space-y-3">
            {reportData.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <div>
                  <span className="text-gray-700 font-medium">
                    {typeof w === 'string' ? w : w.point}
                  </span>
                  {typeof w !== 'string' && w.teacherNote && (
                    <p className="text-sm text-gray-500 mt-1">
                      Lehrerhinweis: "{w.teacherNote}"
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {reportData.recommendations && reportData.recommendations.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-700 mb-3">📚 Empfehlungen</h2>
          <ul className="space-y-4">
            {reportData.recommendations.map((r, i) => (
              <li key={i} className="bg-white p-4 rounded shadow-sm">
                <p className="text-gray-700">
                  {typeof r === 'string' ? r : r.action}
                </p>
                {typeof r !== 'string' && (
                  <div className="flex gap-3 mt-2">
                    {r.timeframe && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        ⏱️ {r.timeframe}
                      </span>
                    )}
                    {r.priority && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        r.priority === 'kritisch' ? 'bg-red-100 text-red-700' :
                        r.priority === 'hoch' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {r.priority}
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {reportData.summary && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">📝 Zusammenfassung</h2>
          <p className="text-gray-600 leading-relaxed">{reportData.summary}</p>
        </div>
      )}

      {/* Toggle Raw Extraction */}
      {extractedText && (
        <div className="border-t pt-4">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showRaw ? '▼ Rohdaten ausblenden' : '▶ Rohdaten anzeigen'}
          </button>
          {showRaw && (
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {extractedText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    '1': 'sehr gut', '1+': 'sehr gut', '1-': 'sehr gut',
    '2': 'gut', '2+': 'gut', '2-': 'gut',
    '3': 'befriedigend', '3+': 'befriedigend', '3-': 'befriedigend',
    '4': 'ausreichend', '4+': 'ausreichend', '4-': 'ausreichend',
    '5': 'mangelhaft', '5+': 'mangelhaft', '5-': 'mangelhaft',
    '6': 'ungenügend',
  };
  return descriptions[grade] || '';
}

function calculatePercentage(grade: string): number | null {
  const percentages: Record<string, number> = {
    '1': 95, '1+': 98, '1-': 90,
    '2': 80, '2+': 85, '2-': 75,
    '3': 65, '3+': 70, '3-': 60,
    '4': 50, '4+': 55, '4-': 45,
    '5': 30, '5+': 38, '5-': 22,
    '6': 10,
  };
  return percentages[grade] || null;
}