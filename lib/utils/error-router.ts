import errorMessages from '../../error_messages.json';

export type ErrorCode = keyof typeof errorMessages;

/**
 * Maps an ERR_XX, SYS_XX, or HINT_XX code to a localized message.
 * Fallback to a generic internal error message if the code is unknown.
 */
export function resolveErrorMessage(code: string | undefined | null, language: string = 'en'): string {
  if (!code) return '';

  const messages = errorMessages as Record<string, Record<string, string>>;
  const messageSet = messages[code];

  if (!messageSet) {
    // If the code is unknown, fallback to ERR_17 (Internal Server Error)
    const fallback = messages['ERR_17'];
    return fallback ? (fallback[language] || fallback['en']) : 'An unexpected error occurred.';
  }

  return messageSet[language] || messageSet['en'] || 'An unexpected error occurred.';
}

/**
 * Checks if a code is a specialized retry hint.
 */
export function isRetryHint(code: string): boolean {
  return code.startsWith('HINT_');
}

/**
 * Gets the raw error message set for a code (all languages).
 */
export function getMessageSet(code: string): Record<string, string> | null {
  return (errorMessages as Record<string, Record<string, string>>)[code] || null;
}
