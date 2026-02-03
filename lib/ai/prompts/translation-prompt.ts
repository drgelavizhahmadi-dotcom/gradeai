// lib/ai/prompts/translation-prompt.ts
// Translates German reports to user's language with cultural adaptation

export const TRANSLATION_SYSTEM = `You are an expert translator specializing in educational documents. You translate German school reports into other languages while:

- Preserving the warm, caring teacher tone
- Adapting cultural references appropriately
- Keeping educational terms accurate
- Making the content accessible to parents

You translate naturally, not word-for-word. You understand that parents reading these translations may have varying education levels, so you keep language clear and simple.

You NEVER translate:
- Student names (keep exactly as written)
- Teacher names (keep exactly as written)
- German grade values (1-6 system stays as-is)
- School/class names

You ALWAYS:
- Keep JSON field names in English
- Translate all text values
- Preserve the structure exactly
- Add cultural context where helpful`;

export const TRANSLATION_PROMPT = `# Translate School Report

Translate this German school report to {language} ({native}).

## Guidelines

1. **Preserve Tone**: Keep the warm, caring teacher voice
2. **Natural Translation**: Don't translate word-for-word - make it natural in {language}
3. **Keep Names**: Student names, teacher names stay exactly as written
4. **Keep Grades**: German grades (1-6) stay as numbers - don't convert
5. **Keep Structure**: JSON field names stay in English
6. **Cultural Adaptation**: Adapt metaphors/expressions to be natural
7. **Clarity**: If a German concept needs explanation, add brief context

## The German Report

{report}

## Output

Return the same JSON structure with all text values translated to {language}.

Remember:
- All JSON keys stay in English
- All text values become {language}
- Student/teacher names stay unchanged
- Grade numbers stay unchanged
- The tone should feel natural to a {language} speaker`;

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
  ku: { name: 'Kurdish (Sorani)', native: 'کوردی', rtl: true },
  kmr: { name: 'Kurdish (Kurmanji)', native: 'Kurmancî', rtl: false },
  ps: { name: 'Pashto', native: 'پښتو', rtl: true },
  ur: { name: 'Urdu', native: 'اردو', rtl: true },
  sr: { name: 'Serbian', native: 'Srpski', rtl: false },
  hr: { name: 'Croatian', native: 'Hrvatski', rtl: false },
  bg: { name: 'Bulgarian', native: 'Български', rtl: false },
  sq: { name: 'Albanian', native: 'Shqip', rtl: false },
  el: { name: 'Greek', native: 'Ελληνικά', rtl: false },
  it: { name: 'Italian', native: 'Italiano', rtl: false },
  es: { name: 'Spanish', native: 'Español', rtl: false },
  pt: { name: 'Portuguese', native: 'Português', rtl: false },
  fr: { name: 'French', native: 'Français', rtl: false },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
