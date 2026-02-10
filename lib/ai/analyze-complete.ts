// lib/ai/analyze-complete.ts
// Maximum speed + quality: Optimized prompts, parallel execution, smart fallbacks
// Using DeepSeek for cost-effective AI analysis
// Report is generated in GERMAN first (native language of all tests),
// then translated on-demand to the user's chosen language

import OpenAI from 'openai';
import {
  COMPREHENSIVE_TEACHER_SYSTEM,
  COMPREHENSIVE_TEACHER_PROMPT,
} from './prompts/comprehensive-teacher-prompt';
import {
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
  console.log('[Report] Generating comprehensive report in German with DeepSeek...');

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
    console.log('[Report] Has weaknesses:', Array.isArray(report.weaknesses), '| Count:', report.weaknesses?.length || 0);
    console.log('[Report] Has fairnessCheck:', !!report.fairnessCheck, '| Verdict:', report.fairnessCheck?.verdict);
    console.log('[Report] Has exercises:', Array.isArray(report.exercises), '| Count:', report.exercises?.length || 0);
    console.log('[Report] Has flashcards:', Array.isArray(report.flashcards), '| Count:', report.flashcards?.length || 0);
    console.log('[Report] Has weeklyPlan:', !!report.weeklyPlan);
    console.log('[Report] Has parentTips:', !!report.parentTips);

    return { success: true as const, report, duration };
  } catch (error: any) {
    console.error('[Report] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}

// Deep merge to preserve structure - copies missing fields from original to translated
function preserveStructure(original: any, translated: any): any {
  if (!original || typeof original !== 'object') return translated;
  if (!translated || typeof translated !== 'object') return original;

  // Handle arrays
  if (Array.isArray(original)) {
    if (!Array.isArray(translated) || translated.length === 0) {
      return original; // Use original if translation lost the array
    }
    // For arrays, preserve length and merge each item
    return original.map((item, i) => {
      if (i < translated.length) {
        return preserveStructure(item, translated[i]);
      }
      return item;
    });
  }

  // Handle objects
  const result: any = { ...translated };

  for (const key of Object.keys(original)) {
    if (key === '_meta') continue; // Skip metadata

    if (!(key in result) || result[key] === null || result[key] === undefined) {
      // Field missing in translation - use original
      result[key] = original[key];
      console.log(`[Translate] Preserved missing field: ${key}`);
    } else if (typeof original[key] === 'object' && original[key] !== null) {
      // Recursively preserve nested structures
      result[key] = preserveStructure(original[key], result[key]);
    }
  }

  return result;
}

async function translateReport(report: any, targetLanguage: LanguageCode) {
  // German is the base language - no translation needed
  if (targetLanguage === 'de') {
    return { success: true as const, translatedReport: report, duration: 0 };
  }

  const startTime = Date.now();
  const lang = SUPPORTED_LANGUAGES[targetLanguage];
  console.log('[Translate] To', lang.name, 'with DeepSeek...');

  try {
    const translationPrompt = `Translate this German school report to ${lang.name} (${lang.native}).

CRITICAL RULES:
1. Translate ONLY the text values, NOT the JSON field names
2. Keep ALL fields and arrays - do NOT remove any
3. Student names should NOT be translated
4. Grade values (numbers like 1-6) should NOT change
5. Keep the warm, empathetic tone
6. Output ONLY valid JSON - no explanations
7. Translate EVERY German text value - leave NOTHING in German

IMPORTANT: The translated JSON MUST have the exact same structure with ALL fields:
- student, test, grade, teacherFeedback, errorAnalysis
- strengths (array), weaknesses (array)
- flashcards (array - MUST keep all 5+ items)
- exercises (array - MUST keep all 2+ items)
- weeklyPlan (with week1 and week2)
- fairnessCheck (with verdict, reasoning, etc.)
- parentTips (with howToDiscuss, whatToAvoid, motivation)
- resources, messages, summary

GERMAN REPORT:
${JSON.stringify(report, null, 2)}

Respond with ONLY the translated JSON. No explanations.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: 8000, // Increased to handle full report
      messages: [{ role: 'user', content: translationPrompt }],
    });

    const responseText = response.choices[0]?.message?.content || '';

    let translatedReport = extractJSON(responseText);

    // Validate and preserve structure - copy any missing fields from original
    translatedReport = preserveStructure(report, translatedReport);

    // Log what was preserved
    const checkFields = ['weaknesses', 'flashcards', 'exercises', 'weeklyPlan', 'parentTips', 'fairnessCheck'];
    for (const field of checkFields) {
      const origCount = Array.isArray(report[field]) ? report[field].length : (report[field] ? 1 : 0);
      const transCount = Array.isArray(translatedReport[field]) ? translatedReport[field].length : (translatedReport[field] ? 1 : 0);
      if (transCount < origCount) {
        console.log(`[Translate] WARNING: ${field} reduced from ${origCount} to ${transCount}`);
      } else {
        console.log(`[Translate] ✓ ${field}: ${transCount} items preserved`);
      }
    }

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

  // STEP 1: Generate comprehensive report (German base - native language of all tests)
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

  // STEP 2: Translate if needed (German is base, so translate if not German)
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
    reportGerman, // German base report for reference
    timing: {
      report: reportResult.duration,
      translation: translationDuration,
      total: totalDuration,
    },
  };
}

export { SUPPORTED_LANGUAGES };
