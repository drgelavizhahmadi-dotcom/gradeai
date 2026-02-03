// lib/ai/analyze-complete.ts
// Optimized analysis: Teacher Report + Optional Fairness + Translation
// Uses parallel API calls and faster models where appropriate

import Anthropic from '@anthropic-ai/sdk';
import {
  COMPREHENSIVE_TEACHER_SYSTEM,
  COMPREHENSIVE_TEACHER_PROMPT,
} from './prompts/comprehensive-teacher-prompt';
import {
  FAIRNESS_ASSESSMENT_SYSTEM,
  FAIRNESS_ASSESSMENT_PROMPT,
} from './prompts/fairness-assessment-prompt';
import {
  TRANSLATION_SYSTEM,
  TRANSLATION_PROMPT,
  SUPPORTED_LANGUAGES,
} from './prompts/translation-prompt';

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AnalyzeOptions {
  language?: LanguageCode;
  includeFairnessAssessment?: boolean;
}

async function generateComprehensiveReport(extraction: string) {
  const startTime = Date.now();
  console.log('[Report] Starting...');

  try {
    const prompt = COMPREHENSIVE_TEACHER_PROMPT.replace('{extraction}', extraction);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000, // Reduced from 8000
      system: COMPREHENSIVE_TEACHER_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in report response');
    }

    const report = JSON.parse(jsonMatch[0]);
    const duration = Date.now() - startTime;

    console.log('[Report] Done in', duration, 'ms');

    return { success: true as const, report, duration };
  } catch (error: any) {
    console.error('[Report] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}

async function assessFairness(report: any) {
  const startTime = Date.now();
  console.log('[Fairness] Starting...');

  try {
    const prompt = FAIRNESS_ASSESSMENT_PROMPT.replace(
      '{analysis}',
      JSON.stringify(report, null, 2)
    );

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Faster model for fairness
      max_tokens: 2500, // Reduced from 4000
      system: FAIRNESS_ASSESSMENT_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in fairness response');
    }

    const assessment = JSON.parse(jsonMatch[0]);
    const duration = Date.now() - startTime;

    console.log('[Fairness] Done in', duration, 'ms -', assessment.assessmentResult);

    return { success: true as const, assessment, duration };
  } catch (error: any) {
    console.error('[Fairness] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}

async function translateReport(report: any, targetLanguage: LanguageCode) {
  if (targetLanguage === 'de') {
    return { success: true as const, translatedReport: report, duration: 0 };
  }

  const startTime = Date.now();
  const lang = SUPPORTED_LANGUAGES[targetLanguage];
  console.log('[Translate] To', lang.name, '...');

  try {
    const prompt = TRANSLATION_PROMPT
      .replace(/\{language\}/g, lang.name)
      .replace(/\{native\}/g, lang.native)
      .replace('{report}', JSON.stringify(report, null, 2));

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Faster model for translation
      max_tokens: 6000, // Reduced from 10000
      system: TRANSLATION_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in translation response');
    }

    const translatedReport = JSON.parse(jsonMatch[0]);

    translatedReport._meta = {
      language: {
        code: targetLanguage,
        name: lang.name,
        native: lang.native,
        rtl: lang.rtl,
      },
      translatedFrom: 'de',
    };

    const duration = Date.now() - startTime;
    console.log('[Translate] Done in', duration, 'ms');

    return { success: true as const, translatedReport, duration };
  } catch (error: any) {
    console.error('[Translate] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}

export async function analyzeTestComplete(
  extraction: string,
  options: AnalyzeOptions = {}
) {
  const { language = 'de', includeFairnessAssessment = false } = options; // Fairness OFF by default
  const totalStart = Date.now();

  console.log('================================================================');
  console.log('[Analyze] START - Lang:', language, '| Fairness:', includeFairnessAssessment);
  console.log('================================================================');

  // STEP 1: Generate comprehensive teacher report (German) - REQUIRED
  const reportResult = await generateComprehensiveReport(extraction);

  if (!reportResult.success) {
    return {
      success: false as const,
      error: `Report generation failed: ${reportResult.error}`,
      timing: { report: reportResult.duration, fairness: 0, translation: 0, total: Date.now() - totalStart },
    };
  }

  let report = reportResult.report;
  const reportGerman = JSON.parse(JSON.stringify(report));

  // STEP 2 & 3: Run fairness and translation IN PARALLEL
  const parallelTasks: Promise<any>[] = [];

  // Queue fairness assessment if requested
  if (includeFairnessAssessment) {
    parallelTasks.push(
      assessFairness(report).then(result => ({ type: 'fairness', result }))
    );
  }

  // Queue translation if needed
  if (language !== 'de') {
    parallelTasks.push(
      translateReport(report, language).then(result => ({ type: 'translation', result }))
    );
  }

  // Execute parallel tasks
  let fairnessAssessment = null;
  let fairnessDuration = 0;
  let translationDuration = 0;

  if (parallelTasks.length > 0) {
    console.log('[Analyze] Running', parallelTasks.length, 'tasks in parallel...');
    const results = await Promise.all(parallelTasks);

    for (const { type, result } of results) {
      if (type === 'fairness') {
        fairnessDuration = result.duration;
        if (result.success) {
          fairnessAssessment = result.assessment;
          report.fairnessAssessment = fairnessAssessment;
          reportGerman.fairnessAssessment = fairnessAssessment;
        }
      } else if (type === 'translation') {
        translationDuration = result.duration;
        if (result.success) {
          report = result.translatedReport;
        } else {
          // Fallback to German with meta
          report._meta = {
            language: { code: 'de', name: 'German', native: 'Deutsch', rtl: false },
            translationFailed: true,
            requestedLanguage: language,
          };
        }
      }
    }
  }

  // Add meta for German if no translation
  if (language === 'de' && !report._meta) {
    report._meta = {
      language: { code: 'de', name: 'German', native: 'Deutsch', rtl: false },
    };
  }

  const totalDuration = Date.now() - totalStart;

  console.log('================================================================');
  console.log('[Analyze] DONE in', totalDuration, 'ms');
  console.log('[Analyze] Report:', reportResult.duration, 'ms | Fairness:', fairnessDuration, 'ms | Translate:', translationDuration, 'ms');
  console.log('================================================================');

  return {
    success: true as const,
    report,
    reportGerman,
    fairnessAssessment,
    timing: {
      report: reportResult.duration,
      fairness: fairnessDuration,
      translation: translationDuration,
      total: totalDuration,
    },
  };
}

export { SUPPORTED_LANGUAGES };
