/**
 * Google Gemini 1.5 Pro Integration
 * Comprehensive analysis for German school tests
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { TestAnalysis, GERMAN_TEST_ANALYSIS_PROMPT } from '@/lib/ai/prompts';
import { validateTestAnalysis } from './validateAnalysis';

interface Child {
  name: string;
  grade?: string | number | null;
}

/**
 * Transform the precise grade extraction format to TestAnalysis format
 */
function transformPreciseFormat(data: any, childName: string): TestAnalysis {
  console.log('[Transform] Transforming precise grade format...');

  const gradeValue = data.grade?.value || null;
  const gradeConfidence = data.grade?.confidence || 'not_found';
  const confidenceMap: Record<string, number> = {
    'high': 0.95,
    'medium': 0.75,
    'low': 0.50,
    'not_found': 0.0
  };

  console.log(`[Transform] Grade: ${gradeValue}, Confidence: ${gradeConfidence}`);

  return {
    summary: {
      overallGrade: gradeValue || 'Note nicht erkannt',
      overallScore: 0,
      maxScore: 0,
      percentage: 0,
      subject: 'Deutsch', // Default for German tests
      childName: data.student?.name || childName,
      testDate: data.testDate || null,
      executiveSummary: data.teacherComment?.text || '',
      confidence: confidenceMap[gradeConfidence] || 0.5,
    },
    performance: {
      bySection: [],
      trends: [],
    },
    teacherFeedback: {
      written: data.teacherComment?.text || '',
      corrections: [],
      praise: data.strengths || [],
    },
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    recommendations: (data.recommendations || []).map((rec: string, i: number) => ({
      priority: i + 1,
      category: 'Learning',
      action: rec,
      timeframe: '1 week',
      rationale: '',
      resources: [],
    })),
    longTermDevelopment: {
      semesterPrediction: '',
      improvementAreas: data.weaknesses || [],
      goalSetting: '',
    },
    metadata: {
      processingTime: 0,
      timestamp: new Date().toISOString(),
      ocrConfidence: confidenceMap[gradeConfidence] || 0.5,
      aiModel: 'Gemini 2.0 Flash',
      processingSteps: ['OCR', 'Precise Grade Extraction'],
    },
  };
}

/**
 * Transform new German prompt format to TestAnalysis format
 */
function transformNewFormat(data: any): TestAnalysis {
  try {
    console.log('[Transform] Transforming new German prompt format...');
    
    // Ensure we have at least a summary object
    const summary = {
      overallGrade: String(data.header?.grade || data.summary?.overallGrade || 'Unknown'),
      overallScore: Number(data.header?.points) || data.summary?.overallScore || 0,
      maxScore: Number(data.header?.maxPoints) || data.summary?.maxScore || 0,
      percentage: Number(data.header?.percentage) || data.summary?.percentage || 0,
      subject: String(data.header?.subject || data.summary?.subject || 'Unknown'),
      childName: String(data.header?.studentName || data.summary?.childName || 'Student'),
      testDate: data.header?.testDate || data.summary?.testDate,
      executiveSummary: data.emotionalIntroduction || data.summary?.executiveSummary,
      topic: data.header?.topic || data.summary?.topic,
      confidence: Math.min(1, Math.max(0, (Number(data.header?.confidenceScore) || Number(data.summary?.confidence) || 0) / 100)),
    };

    // Ensure performance object exists
    const bySection = (data.examinationStructure || [])
      .filter((task: any) => task)
      .map((task: any) => ({
        name: String(task.taskType || task.name || 'Task'),
        pointsAchieved: Number(task.pointsAchieved || 0),
        pointsPossible: Number(task.pointsPossible || task.maxPoints || 0),
        percentage: Number(task.percentage || 0),
        notes: String(task.topic || task.notes || ''),
      }));

    const strengths = Array.isArray(data.strengthsAndHope?.strengths)
      ? data.strengthsAndHope.strengths.filter(Boolean).map(String)
      : Array.isArray(data.strengths)
      ? data.strengths.filter(Boolean).map(String)
      : [];

    const weaknesses = Array.isArray(data.topErrorAnalysis)
      ? data.topErrorAnalysis
          .filter(Boolean)
          .map((e: any) => String(e.errorType || e || ''))
          .filter(Boolean)
      : Array.isArray(data.weaknesses)
      ? data.weaknesses.filter(Boolean).map(String)
      : [];

    const recommendations = (data.prioritizedLearningPlan || [])
      .filter((item: any) => item)
      .map((item: any) => ({
        priority: Number(item.priority || 1),
        category: String(item.category || item.what || 'Learning'),
        action: String(item.action || item.how || item.what || 'Practice'),
        timeframe: String(item.timeframe || '1 week'),
        rationale: String(item.rationale || item.why || ''),
        resources: Array.isArray(item.resources) ? item.resources.map(String) : [],
      }));

    const result = {
      summary,
      performance: {
        bySection,
        trends: Array.isArray(data.performance?.trends) ? data.performance.trends.map(String) : [],
      },
      teacherFeedback: {
        evaluationMethodology: data.fairnessCheck?.assessment,
        written: data.parentActionPlan?.thisWeek?.join('\n') || String(data.teacherComment || ''),
        corrections: Array.isArray(data.teacherFeedback?.corrections)
          ? data.teacherFeedback.corrections.map(String)
          : [],
        praise: strengths.slice(0, 3),
      },
      strengths,
      weaknesses,
      recommendations,
      timeManagement: data.timeManagement,
      languageEnhancement: data.languageEnhancement,
      longTermDevelopment: {
        semesterPrediction: String(data.strengthsAndHope?.outlook || data.prediction?.outlook || ''),
        improvementAreas: weaknesses,
        goalSetting: String(data.strengthsAndHope?.outlook || ''),
      },
      metadata: {
        processingTime: 0,
        timestamp: new Date().toISOString(),
        ocrConfidence: Math.min(1, Math.max(0, (Number(data.header?.confidenceScore || data.metadata?.ocrConfidence) || 0) / 100)),
        aiModel: 'Gemini 1.5 Pro',
        processingSteps: ['OCR', 'Visual Detection', 'AI Analysis'],
      },
    };

    console.log('[Transform] ✓ Successfully transformed new format');
    console.log('[Transform]   - Grade:', summary.overallGrade);
    console.log('[Transform]   - Subject:', summary.subject);
    console.log('[Transform]   - Strengths:', strengths.length);
    console.log('[Transform]   - Weaknesses:', weaknesses.length);
    console.log('[Transform]   - Recommendations:', recommendations.length);

    return result;
  } catch (error) {
    console.error('[Transform] Error during transformation:', error);
    console.error('[Transform] Input data keys:', Object.keys(data || {}));
    
    // Return a minimal valid structure if transformation fails
    return {
      summary: {
        overallGrade: 'Unable to determine',
        overallScore: 0,
        maxScore: 0,
        percentage: 0,
        subject: 'Unknown',
        childName: 'Student',
        confidence: 0,
      },
      performance: { bySection: [], trends: [] },
      teacherFeedback: { written: '', corrections: [], praise: [] },
      strengths: [],
      weaknesses: [],
      recommendations: [],
      longTermDevelopment: {
        semesterPrediction: '',
        improvementAreas: [],
        goalSetting: '',
      },
      metadata: {
        processingTime: 0,
        timestamp: new Date().toISOString(),
        ocrConfidence: 0,
        aiModel: 'Gemini 1.5 Pro',
        processingSteps: [],
      },
    };
  }
}

export async function analyzeWithGemini(
  extractedText: string,
  child: Child | null,
  _targetLanguage: string = 'en' // Prefixed with _ to indicate intentionally unused
): Promise<TestAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const childName = child?.name || 'Student';

  // Use the precise German test prompt for accurate grade extraction
  const prompt = GERMAN_TEST_ANALYSIS_PROMPT.replace('{extractedText}', extractedText);

  console.log('================================================================================');
  console.log('[Gemini] === Starting Gemini Analysis ===');
  console.log('[Gemini] Using PRECISE German test analysis prompt');
  console.log('[Gemini] Model: gemini-2.0-flash');
  console.log(`[Gemini] Input text length: ${extractedText.length} chars`);
  console.log(`[Gemini] Prompt length: ${prompt.length} chars`);
  console.log('[Gemini] Sending request...');
  console.log('================================================================================');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash', // Stable version (was gemini-2.0-flash-exp)
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4000,
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  console.log('[Gemini] ✓ Response received');
  console.log('[Gemini] Response length:', text.length, 'chars');
  console.log('[Gemini] Raw response preview (first 500 chars):');
  console.log(text.substring(0, 500));
  console.log('[Gemini] ...');

  // Parse JSON from response (handle markdown code blocks)
  let analysis: any;
  try {
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    analysis = JSON.parse(jsonText.trim());
    console.log('[Gemini] ✓ JSON parsed successfully');
  } catch (error) {
    console.error('[Gemini] Failed to parse JSON:', error);
    console.error('[Gemini] Raw response:', text.substring(0, 500));
    throw new Error('Failed to parse Gemini response as JSON');
  }

  // Check response format and transform accordingly
  let result_analysis: TestAnalysis;

  if (analysis.grade !== undefined) {
    // New PRECISE format from GERMAN_TEST_ANALYSIS_PROMPT
    console.log('[Gemini] Detected PRECISE grade extraction format');
    result_analysis = transformPreciseFormat(analysis, childName);
  } else if (analysis.header || analysis.examinationStructure || analysis.strengthsAndHope || analysis.emotionalIntroduction) {
    // Old German prompt format
    console.log('[Gemini] Detected old German prompt format, transforming...');
    result_analysis = transformNewFormat(analysis);
  } else if (analysis.summary && analysis.performance) {
    // Legacy format
    console.log('[Gemini] Detected legacy format, normalizing...');
    const norm = { ...analysis };
    if (norm.summary) {
      norm.summary.overallScore = typeof norm.summary.overallScore === 'number' && !isNaN(norm.summary.overallScore) ? norm.summary.overallScore : 0;
      norm.summary.maxScore = typeof norm.summary.maxScore === 'number' && !isNaN(norm.summary.maxScore) ? norm.summary.maxScore : 0;
      norm.summary.percentage = typeof norm.summary.percentage === 'number' && !isNaN(norm.summary.percentage) ? norm.summary.percentage : 0;
      norm.summary.testDate = typeof norm.summary.testDate === 'string' ? norm.summary.testDate : '';
    }
    if (norm.teacherFeedback) {
      if (Array.isArray(norm.teacherFeedback.written)) {
        norm.teacherFeedback.written = norm.teacherFeedback.written.join('\n');
      } else if (norm.teacherFeedback.written == null) {
        norm.teacherFeedback.written = '';
      }
    }
    result_analysis = norm as TestAnalysis;
  } else {
    // Fallback - try precise format first
    console.warn('[Gemini] Unknown format, attempting precise format transformation...');
    result_analysis = transformPreciseFormat(analysis, childName);
  }

  // SCHEMA VALIDATION
  try {
    result_analysis = validateTestAnalysis(result_analysis);
  } catch (err) {
    console.error('[Gemini] Invalid TestAnalysis structure:', err);
    throw err;
  }

  console.log('================================================================================');
  console.log('[Gemini] === Analysis Complete ===');
  console.log(`[Gemini] Grade found: ${result_analysis.summary.overallGrade}`);
  console.log(`[Gemini] Subject: ${result_analysis.summary.subject}`);
  console.log(`[Gemini] Confidence: ${(result_analysis.summary.confidence * 100).toFixed(0)}%`);
  console.log(`[Gemini] Strengths: ${result_analysis.strengths?.length || 0}`);
  console.log(`[Gemini] Weaknesses: ${result_analysis.weaknesses?.length || 0}`);
  console.log(`[Gemini] Recommendations: ${result_analysis.recommendations?.length || 0}`);
  console.log(`[Gemini] Teacher comment: ${(result_analysis.teacherFeedback?.written || '').substring(0, 100)}...`);
  console.log('================================================================================');

  return result_analysis;
}

