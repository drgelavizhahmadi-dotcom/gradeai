import { VisionAnalysisResult, ConsensusResult, StrengthItem, WeaknessItem, RecommendationItem } from './types';

export function mergeVisionResults(results: VisionAnalysisResult[]): ConsensusResult {
  console.log('[Consensus] ========================================');
  console.log('[Consensus] Merging results from', results.length, 'providers');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('[Consensus] Successful:', successful.map(r => r.provider).join(', ') || 'none');
  console.log('[Consensus] Failed:', failed.map(r => `${r.provider}(${r.error})`).join(', ') || 'none');

  if (successful.length === 0) {
    console.error('[Consensus] ✗ All providers failed!');
    const errors = failed.map(f => `${f.provider}: ${f.error}`).join('; ');
    throw new Error(`All AI providers failed: ${errors}`);
  }

  // Find grade consensus
  const gradesFound = successful
    .filter(r => r.grade.value && r.grade.confidence !== 'not_found')
    .map(r => ({ provider: r.provider, grade: r.grade.value, confidence: r.grade.confidence }));

  console.log('[Consensus] Grades found:', JSON.stringify(gradesFound));

  let gradeAgreement: 'full' | 'partial' | 'none';
  let consensusGrade: string | null = null;
  let gradeConfidence: 'high' | 'medium' | 'low' | 'not_found' = 'not_found';
  let gradeFoundOnPage: number | null = null;

  if (gradesFound.length === 0) {
    gradeAgreement = 'none';
    console.log('[Consensus] ⚠ No grades found by any provider');
  } else if (gradesFound.length === 1) {
    gradeAgreement = 'partial';
    consensusGrade = gradesFound[0].grade;
    gradeConfidence = gradesFound[0].confidence as any;
    // Find the page where grade was found
    const gradeResult = successful.find(r => r.grade.value === consensusGrade);
    gradeFoundOnPage = gradeResult?.grade.foundOnPage || null;
    console.log('[Consensus] Single grade found:', consensusGrade, 'by', gradesFound[0].provider);
  } else {
    const uniqueGrades = Array.from(new Set(gradesFound.map(g => normalizeGrade(g.grade!))));

    if (uniqueGrades.length === 1) {
      gradeAgreement = 'full';
      consensusGrade = gradesFound[0].grade;
      gradeConfidence = 'high';
      const gradeResult = successful.find(r => r.grade.value);
      gradeFoundOnPage = gradeResult?.grade.foundOnPage || null;
      console.log('[Consensus] ✓ FULL AGREEMENT on grade:', consensusGrade);
    } else {
      gradeAgreement = 'partial';
      // Use majority vote with preference for high confidence
      const gradeCounts = gradesFound.reduce((acc, g) => {
        const normalized = normalizeGrade(g.grade!);
        if (!acc[normalized]) {
          acc[normalized] = { count: 0, original: g.grade!, confidence: g.confidence };
        }
        acc[normalized].count++;
        // Prefer high confidence
        if (g.confidence === 'high' && acc[normalized].confidence !== 'high') {
          acc[normalized].confidence = 'high';
          acc[normalized].original = g.grade!;
        }
        return acc;
      }, {} as Record<string, { count: number; original: string; confidence: string }>);

      const sorted = Object.entries(gradeCounts).sort((a, b) => {
        // First by count, then by confidence
        if (b[1].count !== a[1].count) return b[1].count - a[1].count;
        if (b[1].confidence === 'high' && a[1].confidence !== 'high') return 1;
        if (a[1].confidence === 'high' && b[1].confidence !== 'high') return -1;
        return 0;
      });

      consensusGrade = sorted[0][1].original;
      gradeConfidence = 'medium';

      console.log('[Consensus] ⚠ PARTIAL agreement, using majority:', consensusGrade);
      console.log('[Consensus] Grade votes:', gradeCounts);
    }
  }

  // Use the best result as base (prefer Claude for quality, then Gemini, then Mistral)
  const priorityOrder = ['claude', 'gemini', 'mistral'];
  const baseResult = [...successful].sort((a, b) =>
    priorityOrder.indexOf(a.provider) - priorityOrder.indexOf(b.provider)
  )[0];

  console.log('[Consensus] Base result from:', baseResult.provider);

  // Merge student info (prefer non-null values)
  const studentName = successful.find(r => r.student.name)?.student.name || null;
  const studentClass = successful.find(r => r.student.class)?.student.class || null;

  // Merge test info
  const subject = successful.find(r => r.test.subject)?.test.subject || null;
  const testDate = successful.find(r => r.test.date)?.test.date || null;
  const topic = successful.find(r => r.test.topic)?.test.topic || null;
  const duration = successful.find(r => r.test.duration)?.test.duration || null;

  // Merge teacher feedback
  const mainComment = successful.find(r => r.teacherFeedback.mainComment)?.teacherFeedback.mainComment || null;
  const marginNotes = deduplicateStrings(successful.flatMap(r => r.teacherFeedback.marginNotes || []));
  const corrections = deduplicateStrings(successful.flatMap(r => r.teacherFeedback.corrections || []));
  const tone = successful.find(r => r.teacherFeedback.tone)?.teacherFeedback.tone || null;

  // Merge strengths from all successful providers (deduplicate)
  const allStrengths: StrengthItem[] = [];
  const seenStrengths = new Set<string>();

  for (const result of successful) {
    for (const strength of result.strengths || []) {
      const key = strength.point.toLowerCase().substring(0, 50);
      if (!seenStrengths.has(key)) {
        seenStrengths.add(key);
        allStrengths.push(strength);
      }
    }
  }

  // Merge weaknesses from all successful providers (deduplicate)
  const allWeaknesses: WeaknessItem[] = [];
  const seenWeaknesses = new Set<string>();

  for (const result of successful) {
    for (const weakness of result.weaknesses || []) {
      const key = weakness.point.toLowerCase().substring(0, 50);
      if (!seenWeaknesses.has(key)) {
        seenWeaknesses.add(key);
        allWeaknesses.push(weakness);
      }
    }
  }

  // Merge recommendations (deduplicate)
  const allRecommendations: RecommendationItem[] = [];
  const seenRecs = new Set<string>();

  for (const result of successful) {
    for (const rec of result.recommendations || []) {
      const key = rec.action.toLowerCase().substring(0, 50);
      if (!seenRecs.has(key)) {
        seenRecs.add(key);
        allRecommendations.push(rec);
      }
    }
  }

  // Sort recommendations by priority
  allRecommendations.sort((a, b) => {
    const priorityMap = { high: 0, medium: 1, low: 2 };
    return (priorityMap[a.priority] || 1) - (priorityMap[b.priority] || 1);
  });

  // Build warnings
  const warnings: string[] = [];

  if (failed.length > 0) {
    warnings.push(`${failed.length} AI provider(s) failed: ${failed.map(f => f.provider).join(', ')}`);
  }

  if (gradeAgreement === 'none') {
    warnings.push('Grade could not be automatically detected. Please verify manually.');
  } else if (gradeAgreement === 'partial' && gradesFound.length > 1) {
    warnings.push('AI providers disagreed on the grade. Result may need verification.');
  }

  // Calculate overall confidence
  const avgConfidence = successful.reduce((sum, r) => sum + (r.metadata?.confidence || 0), 0) / successful.length;
  const agreementBonus = gradeAgreement === 'full' ? 15 : gradeAgreement === 'partial' ? 5 : -10;
  const successRatio = successful.length / results.length;
  const overallConfidence = Math.min(100, Math.max(0, avgConfidence + agreementBonus + (successRatio * 10)));

  // Merge grade breakdown from all sources
  let gradeBreakdown: Record<string, string> | null = null;
  for (const result of successful) {
    if (result.grade.breakdown && Object.keys(result.grade.breakdown).length > 0) {
      gradeBreakdown = { ...(gradeBreakdown || {}), ...result.grade.breakdown };
    }
  }

  // Build final result
  const finalResult: VisionAnalysisResult = {
    provider: baseResult.provider,
    success: true,
    durationMs: Math.max(...successful.map(r => r.durationMs)),
    student: {
      name: studentName,
      class: studentClass,
    },
    test: {
      subject,
      date: testDate,
      topic,
      duration,
    },
    grade: {
      value: consensusGrade,
      description: baseResult.grade.description,
      points: successful.find(r => r.grade.points)?.grade.points || null,
      breakdown: gradeBreakdown,
      confidence: gradeConfidence,
      foundOnPage: gradeFoundOnPage,
    },
    teacherFeedback: {
      mainComment,
      marginNotes,
      corrections,
      tone,
    },
    strengths: allStrengths,
    weaknesses: allWeaknesses,
    recommendations: allRecommendations,
    metadata: {
      pagesAnalyzed: baseResult.metadata.pagesAnalyzed,
      confidence: overallConfidence,
      hasRedMarks: successful.some(r => r.metadata.hasRedMarks),
      hasHandwriting: successful.some(r => r.metadata.hasHandwriting),
    },
  };

  console.log('[Consensus] ========================================');
  console.log('[Consensus] ✓ FINAL RESULT:');
  console.log('[Consensus]   Grade:', finalResult.grade.value, `(${gradeAgreement} agreement)`);
  console.log('[Consensus]   Student:', finalResult.student.name);
  console.log('[Consensus]   Subject:', finalResult.test.subject);
  console.log('[Consensus]   Strengths:', allStrengths.length);
  console.log('[Consensus]   Weaknesses:', allWeaknesses.length);
  console.log('[Consensus]   Recommendations:', allRecommendations.length);
  console.log('[Consensus]   Overall confidence:', overallConfidence.toFixed(0));
  console.log('[Consensus] ========================================');

  return {
    finalResult,
    consensus: {
      gradeAgreement,
      providersUsed: results.map(r => r.provider),
      providersSucceeded: successful.map(r => r.provider),
      providersFailed: failed.map(r => r.provider),
    },
    individualResults: results,
    warnings,
    overallConfidence,
  };
}

// Normalize grades for comparison (e.g., "2+" and "2" are similar)
function normalizeGrade(grade: string): string {
  // Remove +/- for comparison
  return grade.replace(/[+-]/g, '').trim();
}

// Deduplicate strings case-insensitively
function deduplicateStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of arr) {
    const key = item.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
