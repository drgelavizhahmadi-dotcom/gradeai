/**
 * Mistral Large 2 Integration (Fallback)
 * Cost: ~€0.03-0.04 per analysis
 */

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
        written: Array.isArray(data.parentActionPlan?.thisWeek)
          ? data.parentActionPlan.thisWeek.join('\n')
          : (typeof data.parentActionPlan?.thisWeek === 'string' ? data.parentActionPlan.thisWeek : String(data.teacherComment || '')),
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
        aiModel: 'Mistral Large 2',
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
        aiModel: 'Mistral Large 2',
        processingSteps: [],
      },
    };
  }
}

export async function analyzeWithMistral(
  extractedText: string,
  child: Child | null,
  targetLanguage: string = 'en'
): Promise<TestAnalysis> {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  const childName = child?.name || 'Student';
  const grade = child?.grade || 'Unknown Grade';

  const prompt = getAnalysisPrompt(extractedText, childName, String(grade), undefined, undefined, undefined, undefined, targetLanguage);

  console.log('================================================================================');
  console.log('[Mistral] === Starting Mistral Large 2 Analysis ===');
  console.log('[Mistral] Model: mistral-large-latest');
  console.log(`[Mistral] Input text length: ${extractedText.length} chars`);
  console.log(`[Mistral] Prompt length: ${prompt.length} chars`);
  console.log(`[Mistral] Child name: ${childName}`);
  console.log(`[Mistral] Target language: ${targetLanguage}`);
  console.log('[Mistral] Sending request...');
  console.log('================================================================================');

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessment analyst specializing in German school tests. Your analysis must be thorough, accurate, and actionable for parents. Reason in English for accuracy, but return all user-facing JSON string fields in the requested output language. Return ONLY valid JSON, nothing else.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent, accurate output
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Mistral] API Error:', errorText);
    throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  console.log('[Mistral] ✓ Response received');
  console.log(`[Mistral] Tokens used: ${data.usage?.total_tokens || 'unknown'}`);

  try {
    // Validate and repair JSON if needed
    let jsonContent = content.trim();
    
    // Try to fix common JSON issues
    if (!jsonContent.startsWith('{')) {
      const match = jsonContent.match(/\{[\s\S]*\}/);
      if (match) {
        console.log('[Mistral] ⚠️  Extracted JSON from malformed response');
        jsonContent = match[0];
      }
    }
    
    // Attempt to close any incomplete JSON
    if (!jsonContent.endsWith('}')) {
      console.log('[Mistral] ⚠️  Response appears truncated, attempting to repair...');
      let braceCount = (jsonContent.match(/\{/g) || []).length - (jsonContent.match(/\}/g) || []).length;
      while (braceCount > 0) {
        jsonContent += '}';
        braceCount--;
      }
    }
    
    const analysis = JSON.parse(jsonContent);
    console.log('[Mistral] ✓ JSON parsed successfully');
    
    // Check if it's old format (has summary & performance) or new format (has header & examinationStructure)
    let result_analysis: TestAnalysis;
    
    if (analysis.header || analysis.examinationStructure || analysis.strengthsAndHope || analysis.emotionalIntroduction) {
      // New German prompt format
      console.log('[Mistral] Detected new German prompt format, transforming...');
      result_analysis = transformNewFormat(analysis);
    } else if (analysis.summary && analysis.performance) {
      // Old format
      console.log('[Mistral] Detected old format, using as-is');
      result_analysis = analysis as TestAnalysis;
    } else {
      // Try to extract what we can
      console.warn('[Mistral] Unknown format, attempting transformation...');
      result_analysis = transformNewFormat(analysis);
    }
    
    console.log('================================================================================');
    console.log('[Mistral] === Analysis Complete ===');
    console.log(`[Mistral] Grade found: ${result_analysis.summary?.overallGrade}`);
    console.log(`[Mistral] Subject: ${result_analysis.summary?.subject}`);
    console.log(`[Mistral] Confidence: ${((result_analysis.summary?.confidence || 0) * 100).toFixed(0)}%`);
    console.log(`[Mistral] Strengths: ${result_analysis.strengths?.length || 0} items`);
    console.log(`[Mistral] Weaknesses: ${result_analysis.weaknesses?.length || 0} items`);
    console.log(`[Mistral] Recommendations: ${result_analysis.recommendations?.length || 0} items`);
    console.log(`[Mistral] Teacher comment: ${(result_analysis.teacherFeedback?.written || '').substring(0, 100)}...`);
    console.log('================================================================================');

    return result_analysis;
  } catch (parseError) {
    console.error('[Mistral] Failed to parse JSON response');
    console.error('[Mistral] Content length:', content.length);
    console.error('[Mistral] Content preview:', content.substring(0, 500));
    throw new Error('Mistral returned invalid JSON');
  }
}
