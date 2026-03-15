import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

/**
 * VerificationAgent specialized in early failure detection (ERR_XX codes).
 * It analyzes the extraction and ensures it adheres to validation rules.
 */
export async function runVerificationAgent(extraction: string): Promise<{ 
  valid: boolean; 
  errorCode?: string; 
  reason?: string;
}> {
  console.log('[VerificationAgent] Running sanity check on extraction...');

  const VERIFICATION_SYSTEM_PROMPT = `
You are the GuardAgent for GradeAI. Your job is to verify if the extracted text from an uploaded document represents a valid, graded school test.
If the document is invalid, you must return the specific ERR_XX code.

VALIDATION RULES:
- ERR_01: Not a school exam (e.g., magazine, letter, book page, drawing).
- ERR_05: Mixed subjects or multiple unrelated tests in one upload.
- ERR_06: Official answer key (this is for parents to analyze student work, not just keys).
- ERR_07: No grade or teacher comments found (The AI needs something to analyze).
- ERR_11: Technical Documentation / Code (rejection of database schemas, code snippets, API docs).

RESPONSE FORMAT:
Return ONLY a JSON object:
{
  "valid": boolean,
  "errorCode": "ERR_XX" | null,
  "reason": "Short explanation in English"
}
`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: VERIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this extraction:\n\n${extraction.substring(0, 10000)}` }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('[VerificationAgent] Result:', result);
    return result;
  } catch (error) {
    console.error('[VerificationAgent] Error:', error);
    // Fail safe: if verification agent fails, let the main agent try
    return { valid: true };
  }
}
