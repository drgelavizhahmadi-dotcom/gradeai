// lib/ai/analyze-complete.ts
// Complete analysis orchestrator: Teacher Report + Fairness Assessment + Translation

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
  console.log('[Comprehensive Report] Starting analysis...');

  try {
    const prompt = COMPREHENSIVE_TEACHER_PROMPT.replace('{extraction}', extraction);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: COMPREHENSIVE_TEACHER_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in comprehensive report response');
    }

    const report = JSON.parse(jsonMatch[0]);
    const duration = Date.now() - startTime;

    console.log('[Comprehensive Report] Complete in', duration, 'ms');
    console.log('[Comprehensive Report] Student:', report.student?.name);
    console.log('[Comprehensive Report] Grade:', report.grade?.value);

    return { success: true as const, report, duration };
  } catch (error: any) {
    console.error('[Comprehensive Report] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}

async function assessFairness(report: any) {
  const startTime = Date.now();
  console.log('[Fairness Assessment] Starting assessment...');

  try {
    const prompt = FAIRNESS_ASSESSMENT_PROMPT.replace(
      '{analysis}',
      JSON.stringify(report, null, 2)
    );

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: FAIRNESS_ASSESSMENT_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in fairness assessment response');
    }

    const assessment = JSON.parse(jsonMatch[0]);
    const duration = Date.now() - startTime;

    console.log('[Fairness Assessment] Complete in', duration, 'ms');
    console.log('[Fairness Assessment] Result:', assessment.assessmentResult);

    return { success: true as const, assessment, duration };
  } catch (error: any) {
    console.error('[Fairness Assessment] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}

async function translateReport(report: any, targetLanguage: LanguageCode) {
  if (targetLanguage === 'de') {
    return { success: true as const, translatedReport: report, duration: 0 };
  }

  const startTime = Date.now();
  const lang = SUPPORTED_LANGUAGES[targetLanguage];
  console.log('[Translation] Translating to', lang.name, '...');

  try {
    const prompt = TRANSLATION_PROMPT
      .replace(/\{language\}/g, lang.name)
      .replace(/\{native\}/g, lang.native)
      .replace('{report}', JSON.stringify(report, null, 2));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10000,
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

    // Add language metadata
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
    console.log('[Translation] Complete in', duration, 'ms');

    return { success: true as const, translatedReport, duration };
  } catch (error: any) {
    console.error('[Translation] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}

export async function analyzeTestComplete(
  extraction: string,
  options: AnalyzeOptions = {}
) {
  const { language = 'de', includeFairnessAssessment = true } = options;
  const totalStart = Date.now();

  console.log('================================================================');
  console.log('[Analyze Complete] STARTING COMPREHENSIVE ANALYSIS');
  console.log('[Analyze Complete] Target language:', language);
  console.log('[Analyze Complete] Include fairness:', includeFairnessAssessment);
  console.log('================================================================');

  // STEP 1: Generate comprehensive teacher report (German)
  console.log('[Analyze Complete] STEP 1: Comprehensive Teacher Report...');
  const reportResult = await generateComprehensiveReport(extraction);

  if (!reportResult.success) {
    return {
      success: false as const,
      error: `Report generation failed: ${reportResult.error}`,
      timing: { report: reportResult.duration, fairness: 0, translation: 0, total: Date.now() - totalStart },
    };
  }

  let report = reportResult.report;
  let fairnessAssessment = null;
  let fairnessDuration = 0;

  // STEP 2: Fairness assessment (if requested)
  if (includeFairnessAssessment) {
    console.log('[Analyze Complete] STEP 2: Fairness Assessment...');
    const fairnessResult = await assessFairness(report);
    fairnessDuration = fairnessResult.duration;

    if (fairnessResult.success) {
      fairnessAssessment = fairnessResult.assessment;
      // Add fairness assessment to report
      report.fairnessAssessment = fairnessAssessment;
      console.log('[Analyze Complete] Fairness assessment added');
    } else {
      console.warn('[Analyze Complete] Fairness assessment failed:', fairnessResult.error);
      // Continue without fairness assessment
    }
  }

  // Keep German report
  const reportGerman = JSON.parse(JSON.stringify(report));

  // STEP 3: Translation (if needed)
  let translationDuration = 0;

  if (language !== 'de') {
    console.log('[Analyze Complete] STEP 3: Translation to', language, '...');
    const translateResult = await translateReport(report, language);
    translationDuration = translateResult.duration;

    if (translateResult.success) {
      report = translateResult.translatedReport;
      console.log('[Analyze Complete] Translation complete');
    } else {
      console.warn('[Analyze Complete] Translation failed, using German report:', translateResult.error);
      // Add language meta to German report as fallback
      report._meta = {
        language: {
          code: 'de',
          name: 'German',
          native: 'Deutsch',
          rtl: false,
        },
        translationFailed: true,
        requestedLanguage: language,
      };
    }
  } else {
    // German - add meta
    report._meta = {
      language: {
        code: 'de',
        name: 'German',
        native: 'Deutsch',
        rtl: false,
      },
    };
  }

  const totalDuration = Date.now() - totalStart;

  console.log('================================================================');
  console.log('[Analyze Complete] COMPLETE');
  console.log('[Analyze Complete] Total time:', totalDuration, 'ms');
  console.log('[Analyze Complete] Report:', reportResult.duration, 'ms');
  console.log('[Analyze Complete] Fairness:', fairnessDuration, 'ms');
  console.log('[Analyze Complete] Translation:', translationDuration, 'ms');
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
