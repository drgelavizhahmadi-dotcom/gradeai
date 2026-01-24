/**
 * Claude 3.5 Sonnet Integration
 * Using Anthropic API for comprehensive test analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { TestAnalysis, getAnalysisPrompt } from '@/lib/ai/prompts';

interface Child {
  name: string;
  grade?: string | number | null;
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
        aiModel: 'Claude Sonnet 4',
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
        aiModel: 'Claude Sonnet 4',
        processingSteps: [],
      },
    };
  }
}

export async function analyzeWithClaude(
  extractedText: string,
  child: Child | null,
  targetLanguage: string = 'en'
): Promise<TestAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const childName = child?.name || 'Student';
  const grade = child?.grade || 'Unknown Grade';

  const prompt = getAnalysisPrompt(extractedText, childName, String(grade), undefined, undefined, undefined, undefined, targetLanguage);

  console.log('================================================================================');
  console.log('[Claude] === Starting Claude Sonnet 4 Analysis ===');
  console.log('[Claude] Model: claude-sonnet-4-20250514');
  console.log(`[Claude] Input text length: ${extractedText.length} chars`);
  console.log(`[Claude] Prompt length: ${prompt.length} chars`);
  console.log(`[Claude] Child name: ${childName}`);
  console.log(`[Claude] Target language: ${targetLanguage}`);
  console.log('[Claude] Sending request...');
  console.log('================================================================================');

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  if (!content.text) {
    console.error('[Claude] ✗ Empty response from Claude');
    throw new Error('Claude returned empty response');
  }

  console.log('[Claude] ✓ Response received');
  console.log(`[Claude] Tokens used: input=${response.usage.input_tokens}, output=${response.usage.output_tokens}`);
  console.log(`[Claude] Response length: ${content.text.length} chars`);

  try {
    // Extract JSON from response (Claude might wrap it in markdown)
    let jsonText = content.text.trim();
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    if (!jsonText) {
      throw new Error('No JSON found in response');
    }

    const analysis = JSON.parse(jsonText);
    console.log('[Claude] ✓ JSON parsed successfully');
    
    // Check if it's old format (has summary & performance) or new format (has header & examinationStructure)
    let result_analysis: TestAnalysis;
    
    if (analysis.header || analysis.examinationStructure || analysis.strengthsAndHope || analysis.emotionalIntroduction) {
      // New German prompt format
      console.log('[Claude] Detected new German prompt format, transforming...');
      result_analysis = transformNewFormat(analysis);
    } else if (analysis.summary && analysis.performance) {
      // Old format
      console.log('[Claude] Detected old format, using as-is');
      result_analysis = analysis as TestAnalysis;
    } else {
      // Try to extract what we can
      console.warn('[Claude] Unknown format, attempting transformation...');
      result_analysis = transformNewFormat(analysis);
    }
    
    console.log('================================================================================');
    console.log('[Claude] === Analysis Complete ===');
    console.log(`[Claude] Grade found: ${result_analysis.summary?.overallGrade}`);
    console.log(`[Claude] Subject: ${result_analysis.summary?.subject}`);
    console.log(`[Claude] Confidence: ${((result_analysis.summary?.confidence || 0) * 100).toFixed(0)}%`);
    console.log(`[Claude] Strengths: ${result_analysis.strengths?.length || 0} items`);
    console.log(`[Claude] Weaknesses: ${result_analysis.weaknesses?.length || 0} items`);
    console.log(`[Claude] Recommendations: ${result_analysis.recommendations?.length || 0} items`);
    console.log(`[Claude] Teacher comment: ${(result_analysis.teacherFeedback?.written || '').substring(0, 100)}...`);
    console.log('================================================================================');

    return result_analysis;
  } catch (parseError) {
    console.error('[Claude] Failed to parse JSON response');
    console.error('[Claude] Raw response:', content.text.substring(0, 500));
    throw new Error(`Claude returned invalid JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}
