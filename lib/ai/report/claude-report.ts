import Anthropic from '@anthropic-ai/sdk';

const REPORT_SYSTEM = `You are a German education expert. Create parent reports from document extractions. Output JSON only. All text in GERMAN.`;

const REPORT_PROMPT = `Create a parent report from this extracted school test content.

## EXTRACTED CONTENT:
{extraction}

## INSTRUCTIONS:
1. Find student name FROM THE EXTRACTION (not from anywhere else)
2. Find grade (Note 1-6, points)
3. Find teacher's main comment (quote exactly)
4. Identify 4+ strengths
5. Identify 4+ weaknesses (with teacher notes)
6. Create 4+ specific recommendations in German
7. Write German summary with student name

## OUTPUT JSON ONLY:

{
  "student": {
    "name": "Name from document",
    "class": "Class if found"
  },
  "test": {
    "subject": "Subject",
    "date": "Date if found",
    "topic": "Topic if found"
  },
  "grade": {
    "value": "5",
    "description": "mangelhaft",
    "percentage": 35,
    "points": "35/100 or breakdown",
    "exactTextFound": "What you saw in extraction"
  },
  "teacherFeedback": {
    "mainComment": "Exact teacher comment",
    "marginNotes": ["note1", "note2"],
    "correctionCount": {"Gr": "high", "R": "medium"}
  },
  "strengths": [
    {"point": "Staerke auf Deutsch", "evidence": "Beweis aus Dokument"}
  ],
  "weaknesses": [
    {"point": "Schwaeche auf Deutsch", "teacherNote": "Lehrerkommentar", "severity": "kritisch/hoch/mittel"}
  ],
  "recommendations": [
    {"action": "Konkrete Empfehlung auf Deutsch", "timeframe": "Zeitrahmen", "priority": "hoch"}
  ],
  "summary": "2-3 Saetze Zusammenfassung auf Deutsch mit dem Namen des Schuelers"
}

RULES:
- Student name MUST come from the extraction, not elsewhere
- All text content in GERMAN
- Quote teacher comments exactly as extracted
- Be specific with recommendations`;

export async function generateReportWithClaude(extraction: string) {
  const startTime = Date.now();
  console.log('[Claude Report] Starting report generation...');
  console.log('[Claude Report] Extraction length:', extraction.length);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false as const,
      error: 'ANTHROPIC_API_KEY not configured',
      report: null,
      duration: 0,
      provider: 'claude' as const,
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const prompt = REPORT_PROMPT.replace('{extraction}', extraction);

    console.log('[Claude Report] Sending request...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: REPORT_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    const reportText = textContent?.type === 'text' ? textContent.text : '';

    // Extract JSON from response
    const jsonMatch = reportText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const report = JSON.parse(jsonMatch[0]);

    const duration = Date.now() - startTime;
    console.log('[Claude Report] Complete');
    console.log('[Claude Report] Student:', report.student?.name);
    console.log('[Claude Report] Grade:', report.grade?.value);
    console.log('[Claude Report] Time:', duration, 'ms');

    return {
      success: true as const,
      report,
      duration,
      provider: 'claude' as const,
    };

  } catch (error: any) {
    console.error('[Claude Report] Error:', error.message);
    return {
      success: false as const,
      error: error.message,
      report: null,
      duration: Date.now() - startTime,
      provider: 'claude' as const,
    };
  }
}
