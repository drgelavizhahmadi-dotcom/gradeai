// lib/ai/prompts/ai-report-prompt.ts
// AI LAYER - Processes raw vision extraction into structured parent report
// Last updated: January 2025

/**
 * System prompt for AI report generation layer
 */
export const AI_REPORT_SYSTEM = `You are an expert German education analyst. You receive raw document extractions from school tests and create comprehensive, accurate parent reports.

Your job:
1. Parse the raw extraction to find all relevant information
2. Identify the grade, student info, teacher feedback
3. Analyze strengths and weaknesses based on teacher comments
4. Generate helpful recommendations for parents
5. Output a structured report in JSON format

ALL text content (strengths, weaknesses, recommendations, summary) must be in GERMAN.

Be thorough. If information exists in the extraction, include it. Never invent information not in the source.`;

/**
 * Main AI layer prompt for report generation
 * Takes raw vision extraction and creates structured report
 */
export const AI_REPORT_PROMPT = `# CREATE PARENT REPORT FROM DOCUMENT EXTRACTION

You have received a raw extraction of a German school test (Klassenarbeit). This extraction contains ALL text and marks from every page of the document.

Your task: Analyze this extraction and create a comprehensive parent report.

## RAW DOCUMENT EXTRACTION:

{visionExtraction}

---

## YOUR ANALYSIS TASKS:

### TASK 1: IDENTIFY STUDENT INFORMATION
Search the extraction for:
- Student's full name (look for "Name:" or handwritten name)
- Class (e.g., "Klasse 10B", "10B/Gb")
- Use the EXACT name found in the document

### TASK 2: IDENTIFY TEST INFORMATION
Search for:
- Subject (Deutsch, Mathematik, etc.)
- Date of test
- Topic/Theme
- Duration
- Type of test (Klassenarbeit, Test, Klausur)

### TASK 3: FIND THE GRADE (CRITICAL!)
Search EVERYWHERE for:
- "Note:" followed by a number or word
- Numbers 1-6 (especially if circled or prominent)
- Point totals (e.g., "35/100", "6/70")
- Grade words: sehr gut, gut, befriedigend, ausreichend, mangelhaft, ungenügend
- Partial grades (Teilnoten) for different categories

Extract:
- The final grade value
- The exact text where you found it
- Any point breakdown (Inhalt, Sprache, etc.)
- Calculate percentage if possible

### TASK 4: EXTRACT TEACHER FEEDBACK
Find ALL teacher comments:
- Main comment (usually longer, at end, often personal)
- Margin notes (short annotations like "?", "Beleg?", "gut")
- Correction symbols used (R, Gr, Z, A, etc.)
- Count approximately how many of each type

### TASK 5: IDENTIFY STRENGTHS
Based on:
- Positive teacher comments ("gut", "richtig", check marks)
- What the student did complete
- Any praise in the main comment
- Structure or effort visible

List at least 3-4 strengths with evidence from the document.

### TASK 6: IDENTIFY WEAKNESSES
Based on:
- Critical teacher comments
- Correction symbols and their frequency
- What the main comment criticizes
- What's missing according to expectations

List weaknesses with the specific teacher note that indicates each one.

### TASK 7: GENERATE RECOMMENDATIONS
Create specific, actionable recommendations:
- Link each to a specific weakness
- Include concrete steps to improve
- Add timeframes (daily, weekly, etc.)
- Prioritize (kritisch, hoch, mittel)

All recommendations must be in GERMAN.

### TASK 8: WRITE SUMMARY
Write a 2-3 sentence summary in GERMAN that:
- Uses the student's actual name
- States the grade
- Mentions one strength
- Identifies the main improvement area
- Ends with encouragement

---

## OUTPUT FORMAT (JSON):

{
  "student": {
    "name": "Full name exactly as found in document",
    "class": "Class designation",
    "nameFoundWhere": "Where in the document you found the name"
  },
  
  "test": {
    "subject": "Subject name",
    "date": "Test date if found",
    "topic": "Topic/theme if found",
    "duration": "Duration if found",
    "type": "Klassenarbeit/Test/Klausur"
  },
  
  "grade": {
    "value": "The grade (e.g., '5')",
    "description": "Grade word (e.g., 'mangelhaft')",
    "percentage": "Calculated or found percentage",
    "exactTextFound": "The exact text where grade was found",
    "foundWhere": "Which page/location",
    "pointsBreakdown": [
      {"category": "Inhalt", "points": "6", "maxPoints": "70"},
      {"category": "Sprache", "points": "3-", "maxPoints": "30"}
    ],
    "totalPoints": "Total if available",
    "confidence": "high/medium/low based on clarity"
  },
  
  "teacherFeedback": {
    "mainComment": {
      "text": "Exact quote of main teacher comment",
      "foundWhere": "Page/location"
    },
    "marginNotes": [
      {"text": "Note text", "location": "Where found", "meaning": "What it indicates"}
    ],
    "correctionSymbols": {
      "R": {"count": "approximate count", "meaning": "Rechtschreibfehler"},
      "Gr": {"count": "count", "meaning": "Grammatikfehler"},
      "Z": {"count": "count", "meaning": "Zeichensetzung"},
      "A": {"count": "count", "meaning": "Ausdruck"}
    },
    "positiveMarks": ["List of positive annotations found"],
    "overallTone": "kritisch/neutral/positiv/gemischt"
  },
  
  "strengths": [
    {
      "point": "Strength in German",
      "evidence": "What in the document shows this",
      "source": "Where you found evidence"
    }
  ],
  
  "weaknesses": [
    {
      "point": "Weakness in German",
      "evidence": "What shows this",
      "teacherNote": "Specific teacher comment about this",
      "severity": "kritisch/hoch/mittel"
    }
  ],
  
  "recommendations": [
    {
      "title": "Short title in German",
      "action": "Detailed action steps in German",
      "basedOn": "Which weakness this addresses",
      "timeframe": "When/how often to practice",
      "priority": "kritisch/hoch/mittel"
    }
  ],
  
  "summary": "2-3 sentence summary in German with student name, grade, strength, weakness, encouragement",
  
  "visualEvidence": {
    "erkannteNote": "Exact text showing grade",
    "punkte": "Formatted points breakdown",
    "korrekturdichte": "Hoch/Mittel/Niedrig based on correction count"
  },
  
  "metadata": {
    "pagesAnalyzed": "Number of pages",
    "extractionQuality": "How complete the extraction was",
    "confidence": "Overall confidence percentage",
    "warnings": ["Any issues or uncertainties"],
    "missingInformation": ["What could not be found"]
  }
}

---

## CRITICAL RULES:

1. **USE DOCUMENT NAME** - The student name must come from the document extraction, not from anywhere else.

2. **QUOTE EXACTLY** - Teacher comments must be quoted exactly as they appear in the extraction.

3. **DON'T INVENT** - If information is not in the extraction, mark it as null or "nicht gefunden".

4. **ALL GERMAN** - All text content (strengths, weaknesses, recommendations, summary) in German.

5. **EVIDENCE-BASED** - Every strength/weakness must have evidence from the extraction.

6. **BE THOROUGH** - Use ALL relevant information from the extraction.

7. **MINIMUM REQUIREMENTS**:
   - At least 3 strengths
   - At least 3 weaknesses
   - At least 4 recommendations
   - Summary must include student name

8. **GRADE ACCURACY** - If grade is unclear, say so. Never guess.

Now analyze the extraction above and generate the complete parent report.`;

/**
 * Compact version for faster processing
 */
export const AI_REPORT_PROMPT_COMPACT = `# CREATE PARENT REPORT FROM EXTRACTION

Analyze the document extraction below and create a parent report.

EXTRACTION:
{visionExtraction}

---

FIND AND EXTRACT:
1. Student name (from document, not context)
2. Grade (Note, points, percentage)
3. Teacher comments (main + margin notes)
4. Strengths (min 3, based on positive marks)
5. Weaknesses (min 3, based on teacher criticism)
6. Recommendations (min 4, in German, with timeframes)

OUTPUT JSON with these fields:
- student: {name, class}
- test: {subject, date, topic}
- grade: {value, description, percentage, exactTextFound, pointsBreakdown}
- teacherFeedback: {mainComment, marginNotes, correctionSymbols}
- strengths: [{point, evidence}]
- weaknesses: [{point, teacherNote, severity}]
- recommendations: [{title, action, timeframe, priority}]
- summary: German summary with student name
- visualEvidence: {erkannteNote, punkte, korrekturdichte}

RULES:
- ALL content in GERMAN
- Use name FROM DOCUMENT
- Quote teacher comments exactly
- Never invent information
- At least 3 strengths, 3 weaknesses, 4 recommendations`;

export default {
  AI_REPORT_SYSTEM,
  AI_REPORT_PROMPT,
  AI_REPORT_PROMPT_COMPACT
};