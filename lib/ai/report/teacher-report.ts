import Anthropic from '@anthropic-ai/sdk';
import { TEACHER_REPORT_SYSTEM, TEACHER_REPORT_PROMPT } from '../prompts/ai-report-prompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateTeacherReport(extraction: string) {
  const startTime = Date.now();

  try {
    console.log('[Teacher Report] Starting teacher-focused analysis...');

    const prompt = TEACHER_REPORT_PROMPT.replace('{visionExtraction}', extraction);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      temperature: 0.3, // Lower temperature for more consistent, teacher-like responses
      system: TEACHER_REPORT_SYSTEM,
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

    const rawText = content.text.trim();

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Teacher Report] No JSON found in response:', rawText.substring(0, 500));
      return {
        success: false as const,
        error: 'No valid JSON found in teacher report response',
        report: null,
        duration: Date.now() - startTime
      };
    }

    let report;
    try {
      report = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[Teacher Report] JSON parse error:', parseError);
      console.error('[Teacher Report] Raw response:', rawText);
      return {
        success: false as const,
        error: `JSON parse error: ${parseError}`,
        report: null,
        duration: Date.now() - startTime
      };
    }

    // Validate required fields
    if (!report.schueler?.name || !report.leistung?.gesamtnote) {
      console.error('[Teacher Report] Missing required fields in report');
      return {
        success: false as const,
        error: 'Report missing required fields (student name or grade)',
        report: null,
        duration: Date.now() - startTime
      };
    }

    console.log('[Teacher Report] Successfully generated teacher report for:', report.schueler.name);

    return {
      success: true as const,
      report,
      duration: Date.now() - startTime
    };

  } catch (error: any) {
    console.error('[Teacher Report] Error:', error.message);
    return {
      success: false as const,
      error: error.message,
      report: null,
      duration: Date.now() - startTime
    };
  }
}