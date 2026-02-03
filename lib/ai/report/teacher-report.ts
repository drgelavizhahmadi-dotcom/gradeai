import Anthropic from '@anthropic-ai/sdk';
import { TEACHER_SYSTEM, TEACHER_PROMPT } from '../prompts/teacher-prompt';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateTeacherReport(extraction: string) {
  const startTime = Date.now();
  console.log('[Teacher Report] Starting teacher-style analysis...');
  console.log('[Teacher Report] Extraction length:', extraction.length, 'chars');

  try {
    const prompt = TEACHER_PROMPT.replace('{extraction}', extraction);

    console.log('[Teacher Report] Sending to Claude...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      system: TEACHER_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const reportText = textContent?.type === 'text' ? textContent.text : '';

    // Extract JSON from response
    const jsonMatch = reportText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Teacher Report] No JSON found in response');
      throw new Error('No JSON found in teacher response');
    }

    const report = JSON.parse(jsonMatch[0]);

    const duration = Date.now() - startTime;
    console.log('[Teacher Report] Analysis complete');
    console.log('[Teacher Report] Student:', report.student?.name);
    console.log('[Teacher Report] Subject:', report.subject);
    console.log('[Teacher Report] Grade:', report.grade?.value);
    console.log('[Teacher Report] Time:', duration, 'ms');

    return {
      success: true as const,
      report,
      duration,
    };

  } catch (error: any) {
    console.error('[Teacher Report] Error:', error.message);
    return {
      success: false as const,
      error: error.message,
      report: null,
      duration: Date.now() - startTime,
    };
  }
}
