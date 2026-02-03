import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const SUPPORTED_LANGUAGES = {
  de: { name: 'German', native: 'Deutsch', rtl: false },
  en: { name: 'English', native: 'English', rtl: false },
  fa: { name: 'Persian/Farsi', native: 'فارسی', rtl: true },
  tr: { name: 'Turkish', native: 'Türkçe', rtl: false },
  ar: { name: 'Arabic', native: 'العربية', rtl: true },
  ru: { name: 'Russian', native: 'Русский', rtl: false },
  uk: { name: 'Ukrainian', native: 'Українська', rtl: false },
  pl: { name: 'Polish', native: 'Polski', rtl: false },
  ro: { name: 'Romanian', native: 'Română', rtl: false },
  vi: { name: 'Vietnamese', native: 'Tiếng Việt', rtl: false },
  zh: { name: 'Chinese', native: '中文', rtl: false },
  ku: { name: 'Kurdish', native: 'کوردی', rtl: true },
  ps: { name: 'Pashto', native: 'پښتو', rtl: true },
  ur: { name: 'Urdu', native: 'اردو', rtl: true },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

const TRANSLATION_PROMPT = `Translate this German school report to {language} ({native}).

Guidelines:
- Keep the warm, caring teacher tone
- Translate naturally, not word-for-word
- Student names stay as-is (don't translate names)
- Grade values stay as-is (German grades 1-6)
- Keep all JSON field names in English
- Only translate the text VALUES

German Report:
{report}

Return the same JSON structure with all text translated to {language}.`;

export async function translateReport(report: any, targetLanguage: LanguageCode) {
  if (targetLanguage === 'de') {
    return { success: true as const, translatedReport: report };
  }

  const startTime = Date.now();
  const lang = SUPPORTED_LANGUAGES[targetLanguage];
  console.log('[Translate] Translating to', lang.name, '...');

  try {
    const prompt = TRANSLATION_PROMPT
      .replace(/\{language\}/g, lang.name)
      .replace('{native}', lang.native)
      .replace('{report}', JSON.stringify(report, null, 2));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in translation response');

    const translatedReport = JSON.parse(jsonMatch[0]);
    translatedReport._language = { code: targetLanguage, ...lang };

    const duration = Date.now() - startTime;
    console.log('[Translate] Complete in', duration, 'ms');
    return { success: true as const, translatedReport, duration };

  } catch (error: any) {
    console.error('[Translate] Error:', error.message);
    return { success: false as const, error: error.message, duration: Date.now() - startTime };
  }
}
