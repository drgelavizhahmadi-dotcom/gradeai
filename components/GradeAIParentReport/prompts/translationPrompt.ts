/**
 * AI TRANSLATION PROMPT
 * 
 * This prompt takes the English analysis data and translates
 * ALL user-facing text to the target language.
 * 
 * Called when: User views the report in their chosen language
 * Cached: Yes, per language per report
 */

export const createTranslationPrompt = (analysisData: any, targetLanguage: string) => {
  return `
You are a professional translator specializing in educational content.

TASK: Translate the following test analysis report to ${targetLanguage}.

TARGET LANGUAGE: ${targetLanguage}
CONTEXT: This is a parent report for a German school test. Parents need to understand their child's performance.

TRANSLATION GUIDELINES:
1. Use natural, fluent ${targetLanguage} - not word-for-word translation
2. Adapt cultural references where appropriate
3. Keep technical terms accurate but add explanations if needed
4. Maintain a warm, supportive, encouraging tone throughout
5. ${['Arabic', 'Farsi/Persian', 'Kurdish Sorani'].includes(targetLanguage) ? 'For RTL languages: ensure proper RTL formatting' : 'For LTR languages: standard formatting'}
6. Keep grade names in German format (1, 2, 3...) but explain their meaning
7. Translate action items to be culturally appropriate

SPECIAL INSTRUCTIONS FOR ${targetLanguage}:
${getLanguageSpecificInstructions(targetLanguage)}

INPUT DATA (English):
${JSON.stringify(analysisData, null, 2)}

OUTPUT FORMAT: Return ONLY valid JSON with the same structure but translated content:

{
  "translatedReport": {
    "header": {
      "title": "translated: GradeAI Parent Report",
      "analyzedOn": "translated: Analyzed on [date]",
      "gradeExplanation": "translated: What this grade means"
    },
    
    "emotionalSupport": {
      "greeting": "translated: Dear Parents,",
      "message": "translated: [appropriate message based on grade]"
    },
    
    "tabs": {
      "overview": "translated",
      "analysis": "translated",
      "action": "translated",
      "strengths": "translated"
    },
    
    "sections": {
      "examStructure": {
        "title": "translated",
        "taskLabels": {
          "task": "translated",
          "type": "translated",
          "topic": "translated",
          "requirement": "translated",
          "weight": "translated",
          "wordCount": "translated",
          "points": "translated",
          "completed": "translated",
          "incomplete": "translated"
        }
      },
      "scores": {
        "title": "translated",
        "criteriaLabels": {
          "content": "translated",
          "language": "translated",
          "structure": "translated",
          "register": "translated",
          "grammar": "translated",
          "spelling": "translated",
          "total": "translated",
          "critical": "translated"
        }
      },
      "fairness": {
        "title": "translated",
        "overallLabel": "translated",
        "assessmentLabels": {
          "fair": "translated",
          "possibly_strict": "translated",
          "possibly_lenient": "translated",
          "review_recommended": "translated"
        },
        "checksLabels": {
          "deductionsTraceable": "translated",
          "criteriaTransparent": "translated",
          "correctionsConsistent": "translated",
          "noIssues": "translated"
        },
        "correctionFrequency": "translated",
        "conclusionPrefix": "translated"
      },
      "warnings": {
        "title": "translated",
        "urgencyLabels": {
          "immediate": "translated",
          "shortTerm": "translated",
          "mediumTerm": "translated"
        },
        "riskLabels": {
          "promotionRisk": "translated",
          "low": "translated",
          "medium": "translated",
          "high": "translated",
          "requiredNextGrade": "translated",
          "remainingExams": "translated"
        }
      },
      "errorAnalysis": {
        "title": "translated",
        "subtitle": "translated",
        "labels": {
          "errorType": "translated",
          "found": "translated",
          "examples": "translated",
          "wrong": "translated",
          "correct": "translated",
          "explanation": "translated",
          "rule": "translated"
        }
      },
      "parentActions": {
        "title": "translated",
        "thisWeekLabel": "translated",
        "nextTwoWeeksLabel": "translated",
        "labels": {
          "talkToChild": "translated",
          "meetTeacher": "translated",
          "checkEnvironment": "translated",
          "organizeTutoring": "translated"
        }
      },
      "learningPlan": {
        "title": "translated",
        "labels": {
          "priority": "translated",
          "duration": "translated",
          "what": "translated",
          "how": "translated",
          "goal": "translated",
          "resources": "translated",
          "timeCommitment": "translated"
        }
      },
      "strengths": {
        "title": "translated",
        "subtitle": "translated",
        "outlookTitle": "translated",
        "labels": {
          "currentTrend": "translated",
          "improvement": "translated",
          "nextGoal": "translated",
          "timeframe": "translated",
          "encouragement": "translated"
        }
      }
    },
    
    "common": {
      "yes": "translated",
      "no": "translated",
      "points": "translated",
      "weeks": "translated",
      "daily": "translated",
      "minutes": "translated",
      "of": "translated",
      "from": "translated"
    },
    
    "footer": {
      "createdWith": "translated: Created with GradeAI",
      "disclaimer": "translated: This is an AI-generated analysis. Please discuss with your child's teacher."
    }
  },
  
  "metadata": {
    "translatedTo": "${targetLanguage}",
    "translationTimestamp": "${new Date().toISOString()}"
  }
}

Return ONLY the JSON object.
`
}

// Language-specific instructions
function getLanguageSpecificInstructions(language: string): string {
  const instructions: Record<string, string> = {
    'German': `
      - Use formal "Sie" form for addressing parents
      - Use proper German compound words
      - Reference German school system terminology correctly
      - Keep educational terms authentic
    `,
    'Turkish': `
      - Use respectful "Siz" form
      - Adapt to Turkish educational context where relevant
      - Use proper Turkish grammar with agglutination
      - Maintain formal tone appropriate for parent-teacher communication
    `,
    'Arabic': `
      - Use Modern Standard Arabic for formal content
      - Ensure proper RTL formatting
      - Use respectful forms of address
      - Numbers can be in Arabic-Indic numerals or Western based on context
      - Maintain formal educational tone
    `,
    'Farsi/Persian': `
      - Use formal Persian (فارسی رسمی)
      - Ensure proper RTL formatting
      - Use respectful forms appropriate for parent communication
      - Adapt school terminology to Iranian/Persian context if possible
      - Keep tone respectful and encouraging
    `,
    'Kurdish Sorani': `
      - Use Central Kurdish (Sorani) script
      - Ensure proper RTL formatting
      - Use respectful Kurdish forms of address
      - Keep educational terms clear and understandable
      - Maintain supportive tone for parents
    `,
    'Kurdish Kurmanji': `
      - Use Northern Kurdish (Kurmanji) in Latin script
      - Use LTR formatting
      - Adapt terminology for Kurdish-speaking communities
      - Keep language clear and accessible
    `,
    'Russian': `
      - Use formal "Вы" form
      - Adapt to Russian educational context
      - Use proper Russian grammar cases
      - Maintain respectful tone for parent communication
    `,
    'Romanian': `
      - Use "dumneavoastră" for formal address
      - Use proper Romanian grammar and diacritics
      - Adapt to Romanian educational system where relevant
      - Keep tone warm and supportive
    `,
    'English': `
      - Use clear, accessible English
      - Explain German grade system for non-German speakers
      - Keep tone warm and supportive
      - Use simple language that all parents can understand
    `
  }
  
  return instructions[language] || instructions['English']
}

export { getLanguageSpecificInstructions }
