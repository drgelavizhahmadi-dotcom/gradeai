/**
 * Analysis Display Component - Wrapper
 * Routes to ComprehensiveAnalysis for new format
 */

'use client';

import { TestAnalysis } from '@/lib/ai/prompts';
import { useLanguage } from '@/components/providers/LanguageProvider';
import ComprehensiveAnalysis from './ComprehensiveAnalysis';
import { AlertTriangle } from 'lucide-react';

interface AnalysisDisplayProps {
  analysis: TestAnalysis | any; // Allow any for backwards compatibility
}

function WarningBanner({ warnings, gradeConfidence, grade }: {
  warnings?: string[]
  gradeConfidence?: number
  grade?: string | null
}) {
  const allWarnings: string[] = []

  // Check grade status
  if (grade === null || grade === undefined || grade === 'Note nicht erkannt') {
    allWarnings.push('Die Note konnte nicht automatisch erkannt werden. Bitte überprüfen Sie das Dokument manuell.')
  } else if (gradeConfidence !== undefined && gradeConfidence < 0.9 && gradeConfidence >= 0.7) {
    allWarnings.push('Die Note ist nicht 100% sicher. Bitte überprüfen Sie das Ergebnis.')
  }

  // Add warnings from metadata
  if (warnings && warnings.length > 0) {
    allWarnings.push(...warnings)
  }

  if (allWarnings.length === 0) {
    return null
  }

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-yellow-800 font-semibold text-sm mb-1">Hinweise</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            {allWarnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  const { t } = useLanguage()

  // Safety check
  if (!analysis) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">{t.errors?.analysisFailed || 'Keine Analyse verfügbar.'}</p>
      </div>
    );
  }

  // Check if we have the new comprehensive format
  if (analysis.summary && analysis.performance) {
    // Sanitize confidence values to prevent NaN display
    if (analysis.summary.confidence === undefined || analysis.summary.confidence === null || !Number.isFinite(analysis.summary.confidence)) {
      analysis.summary.confidence = 0.85;
    }
    if (!analysis.metadata) analysis.metadata = {};
    if (analysis.metadata.ocrConfidence === undefined || analysis.metadata.ocrConfidence === null || !Number.isFinite(analysis.metadata.ocrConfidence)) {
      analysis.metadata.ocrConfidence = 0.85;
    }

    return (
      <>
        <WarningBanner
          warnings={analysis.metadata?.warnings}
          gradeConfidence={analysis.summary?.confidence}
          grade={analysis.summary?.grade}
        />
        <ComprehensiveAnalysis analysis={analysis} />
      </>
    );
  }

  // Fallback for old format
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <p className="text-yellow-800 font-semibold mb-2">
        {t.analysis?.title || 'Altes Analyseformat erkannt'}
      </p>
      <p className="text-yellow-700 text-sm mb-4">
        {t.errors?.analysisFailed || 'Diese Analyse wurde mit dem alten System erstellt. Bitte laden Sie den Test erneut hoch, um die neue umfassende Analyse zu erhalten.'}
      </p>
      {analysis.gradeInterpretation && (
        <div className="mt-4 p-4 bg-white rounded border border-yellow-200">
          <p className="text-sm text-gray-700">{analysis.gradeInterpretation.meaning}</p>
        </div>
      )}
    </div>
  );
}
