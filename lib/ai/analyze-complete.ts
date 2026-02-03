// lib/ai/analyze-complete.ts
// Maximum speed + quality: Optimized prompts, parallel execution, smart fallbacks
// Using DeepSeek for cost-effective AI analysis

import OpenAI from 'openai';
import {
  COMPREHENSIVE_TEACHER_SYSTEM,
  COMPREHENSIVE_TEACHER_PROMPT,
} from './prompts/comprehensive-teacher-prompt';
import {
  TRANSLATION_SYSTEM,
  TRANSLATION_PROMPT,
  SUPPORTED_LANGUAGES,
} from './prompts/translation-prompt';

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// DeepSeek uses OpenAI-compatible API
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

interface AnalyzeOptions {
  language?: LanguageCode;
}

// Robust JSON extraction - handles markdown code blocks, extra text
function extractJSON(text: string): any {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {}

  // Try extracting from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // Try finding JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }

  throw new Error('Could not extract valid JSON from response');
}

async function generateReport(extraction: string) {
  const startTime = Date.now();
  console.log('[Report] Generating comprehensive report with DeepSeek...');

  try {
    const prompt = COMPREHENSIVE_TEACHER_PROMPT.replace('{extraction}', extraction);

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 8000,
      messages: [
        { role: 'system', content: COMPREHENSIVE_TEACHER_SYSTEM },
        { role: 'user', content: prompt },
      ],
    });

    const responseText = response.choices[0]?.message?.content || '';

    const report = extractJSON(responseText);
    const duration = Date.now() - startTime;

    console.log('[Report] Done in', duration, 'ms');
    console.log('[Report] Student:', report.student?.name, '| Grade:', report.grade?.value);

    return { success: true as const, report, duration };
  } catch (error: any) {
    console.error('[Report] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}

async function translateReport(report: any, targetLanguage: LanguageCode) {
  if (targetLanguage === 'de') {
    return { success: true as const, translatedReport: report, duration: 0 };
  }

  const startTime = Date.now();
  const lang = SUPPORTED_LANGUAGES[targetLanguage];
  console.log('[Translate] To', lang.name, 'with DeepSeek...');

  try {
    // Simplified translation prompt for speed
    const translationPrompt = `Übersetze diesen deutschen Schulbericht ins ${lang.name} (${lang.native}).

REGELN:
- Behalte den warmen, einfühlsamen Ton
- Schülernamen NICHT übersetzen
- Notenwerte (1-6) NICHT ändern
- JSON-Feldnamen bleiben Englisch
- Nur die TEXT-WERTE übersetzen

BERICHT:
${JSON.stringify(report, null, 2)}

Antworte NUR mit dem übersetzten JSON.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 5000,
      messages: [{ role: 'user', content: translationPrompt }],
    });

    const responseText = response.choices[0]?.message?.content || '';

    const translatedReport = extractJSON(responseText);

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
    console.log('[Translate] Done in', duration, 'ms');

    return { success: true as const, translatedReport, duration };
  } catch (error: any) {
    console.error('[Translate] Error:', error.message);
    // Return German report with error flag
    return {
      success: false as const,
      error: error.message,
      translatedReport: {
        ...report,
        _meta: {
          language: { code: 'de', name: 'German', native: 'Deutsch', rtl: false },
          translationFailed: true,
          requestedLanguage: targetLanguage,
        },
      },
      duration: Date.now() - startTime,
    };
  }
}

export async function analyzeTestComplete(
  extraction: string,
  options: AnalyzeOptions = {}
) {
  const { language = 'de' } = options;
  const totalStart = Date.now();

  console.log('================================================================');
  console.log('[Analyze] START | Language:', language, '| Provider: DeepSeek');
  console.log('[Analyze] Extraction:', extraction.length, 'chars');
  console.log('================================================================');

  // STEP 1: Generate comprehensive report (German)
  const reportResult = await generateReport(extraction);

  if (!reportResult.success) {
    return {
      success: false as const,
      error: `Report generation failed: ${reportResult.error}`,
      timing: { report: reportResult.duration, translation: 0, total: Date.now() - totalStart },
    };
  }

  let report = reportResult.report;
  const reportGerman = JSON.parse(JSON.stringify(report));

  // STEP 2: Translate if needed
  let translationDuration = 0;

  if (language !== 'de') {
    const translateResult = await translateReport(report, language);
    translationDuration = translateResult.duration;
    report = translateResult.translatedReport;
  } else {
    // Add German meta
    report._meta = {
      language: { code: 'de', name: 'German', native: 'Deutsch', rtl: false },
    };
  }

  const totalDuration = Date.now() - totalStart;

  console.log('================================================================');
  console.log('[Analyze] COMPLETE in', totalDuration, 'ms');
  console.log('[Analyze] Report:', reportResult.duration, 'ms | Translation:', translationDuration, 'ms');
  console.log('================================================================');

  return {
    success: true as const,
    report,
    reportGerman,
    timing: {
      report: reportResult.duration,
      translation: translationDuration,
      total: totalDuration,
    },
  };
}

export { SUPPORTED_LANGUAGES };
