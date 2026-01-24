/**
 * DeepSeek V3 Integration
 * Cost: ~€0.01-0.02 per analysis (14K input + 2K output tokens)
 */

import { TestAnalysis } from '@/lib/ai/prompts';

interface Child {
  name: string;
  grade?: string | number | null;
}

export async function analyzeWithDeepSeek(
  extractedText: string,
  child: Child | null
): Promise<TestAnalysis> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const childName = child?.name || 'Student';
  const grade = child?.grade || 'Unknown Grade';

  const prompt = `Analysiere diese deutsche Klassenarbeit für ${childName} (${grade}).

TEXT DER KLASSENARBEIT:
${extractedText}

ERSTELLE EINEN ANALYSERERICHT mit:
1. Zusammenfassung (Note, Punkte, Fach, Thema)
2. Leistungsübersicht (Aufgabenanalyse)
3. Lehrkraft-Bewertung
4. Stärken (mit Beispielen)
5. Schwächen (mit Beispielen) 
6. Empfehlungen (konkret)
7. Langfristige Entwicklung

Sei präzise und konkret. Antworte NUR mit JSON.

JSON-Format:
{
  "summary": {
    "overallGrade": "3+",
    "overallScore": 42,
    "maxScore": 50,
    "percentage": 84,
    "subject": "Mathematik",
    "topic": "Bruchrechnung",
    "childName": "${childName}",
    "executiveSummary": "Gute Leistung...",
    "confidence": 0.90
  },
  "performance": {
    "bySection": [
      {"name": "Aufgabe 1", "pointsAchieved": 8, "pointsPossible": 10, "notes": "..."}
    ]
  },
  "teacherFeedback": {
    "evaluationMethodology": "Strukturierte Bewertung...",
    "written": "Gute Arbeit...",
    "corrections": ["Rechenfehler in Aufgabe 3"],
    "praise": ["Saubere Handschrift"]
  },
  "strengths": ["Starke Grundrechenfertigkeiten", "Logisches Denken"],
  "weaknesses": ["Schwächen bei Textaufgaben", "Zeitmanagement"],
  "recommendations": [
    {"priority": 1, "category": "Übung", "action": "Tägliche Bruchrechenübungen", "timeframe": "1 Woche"}
  ],
  "longTermDevelopment": {
    "semesterPrediction": "Verbesserung auf 2+ möglich",
    "improvementAreas": ["Textaufgaben", "Zeitmanagement"],
    "goalSetting": "Regelmäßiges Üben"
  },
  "metadata": {
    "processingTime": 0,
    "timestamp": "${new Date().toISOString()}",
    "aiModel": "DeepSeek V3",
    "processingSteps": ["OCR", "AI Analysis"]
  }
}

Antworte NUR mit gültigem JSON, keine zusätzlichen Erklärungen.`;

  console.log('[DeepSeek] Sending request to DeepSeek V3...');
  console.log(`[DeepSeek] Input text length: ${extractedText.length} chars`);

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein erfahrener deutscher Pädagoge, spezialisiert auf Klassenarbeitsanalyse. Antworte präzise und strukturiert auf Deutsch.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DeepSeek] API Error:', errorText);
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  console.log('[DeepSeek] ✓ Response received');
  console.log(`[DeepSeek] Tokens used: ${data.usage?.total_tokens || 'unknown'}`);

  try {
    const analysis = JSON.parse(content);
    console.log('[DeepSeek] ✓ JSON parsed successfully');
    console.log(`[DeepSeek] Found grade: ${analysis.summary?.overallGrade}`);
    console.log(`[DeepSeek] Subject: ${analysis.summary?.subject}`);
    console.log(`[DeepSeek] Strengths: ${analysis.strengths?.length || 0} items`);
    console.log(`[DeepSeek] Weaknesses: ${analysis.weaknesses?.length || 0} items`);
    
    return analysis;
  } catch (parseError) {
    console.error('[DeepSeek] Failed to parse JSON response:', content);
    throw new Error('DeepSeek returned invalid JSON');
  }
}
