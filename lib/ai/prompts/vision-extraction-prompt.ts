// lib/ai/prompts/vision-extraction-prompt.ts
// FREE-FORM VISION EXTRACTION - No rigid structure, capture EVERYTHING
// Last updated: January 2025

/**
 * System prompt for vision extraction
 * Goal: Get ALL information from the document, not just specific fields
 */
export const VISION_EXTRACTION_SYSTEM = `You are a document analysis expert. Your task is to describe EVERYTHING you see in these school test images with perfect accuracy and completeness.

You are the "eyes" of the system. The more detail you provide, the better the final report will be. Miss nothing.

Describe what you see as if you're explaining the document to someone who cannot see it. Include EVERY piece of text, every mark, every color, every detail.`;

/**
 * Main vision extraction prompt
 * This is intentionally open-ended to capture everything
 */
export const VISION_EXTRACTION_PROMPT = `# COMPLETE DOCUMENT EXTRACTION

Look at ALL pages of this document and describe EVERYTHING you see. Do not skip anything. Do not summarize. Extract ALL text and details.

## FOR EACH PAGE, DESCRIBE:

### 1. PAGE OVERVIEW
- What type of page is this? (printed article, handwritten answers, cover sheet, grading rubric, grade sheet, etc.)
- Is the page right-side up or upside down?
- General layout (columns, tables, margins, etc.)

### 2. ALL PRINTED TEXT
- Copy ALL printed text exactly as it appears
- Include headers, titles, instructions
- Include line numbers if present
- Include any highlighted or underlined portions
- Note the language (German, English, etc.)

### 3. ALL HANDWRITTEN TEXT
- Transcribe ALL handwriting as accurately as possible
- Note the ink color (blue, black, red, pink, etc.)
- Indicate if handwriting is student work or teacher comments
- Include margin notes, annotations, corrections
- If text is hard to read, write [unclear: best guess]

### 4. ALL MARKS AND SYMBOLS
- Correction marks (R, Z, Gr, A, Sb, W, etc.)
- Check marks (✓) and crosses (✗)
- Underlines, circles, arrows
- Question marks, exclamation marks
- Strikethroughs
- Point deductions written (e.g., "-2")
- Any stamps or stickers

### 5. NUMBERS AND GRADES
- Any numbers that could be grades (1-6)
- Point totals (e.g., "35/100", "6 von 70")
- Percentages
- Tables with scores
- The word "Note:" followed by anything

### 6. NAMES AND DATES
- Student name (wherever it appears)
- Teacher name/signature
- Dates (test date, grading date)
- Class/grade level

### 7. TEACHER FEEDBACK
- Main comment (usually at end, often starts with "Liebe/r...")
- Margin comments (short notes next to text)
- Any praise or criticism written
- Suggestions or questions from teacher

## OUTPUT FORMAT:

Provide your extraction in this format:

---
## PAGE 1

**Page Type:** [e.g., Reading material - printed article]
**Orientation:** [Right-side up / Upside down]

**Printed Text:**
[Copy all printed text here exactly]

**Handwritten Text:**
[Transcribe all handwriting with ink color noted]

**Marks and Symbols:**
[List all marks seen]

**Numbers/Grades Found:**
[List any numbers that could be grades or points]

**Names/Dates:**
[List any names or dates]

---
## PAGE 2
[Continue same format...]

---
## PAGE 3
[Continue...]

---
[Continue for ALL pages]

---

## IMPORTANT RULES:

1. **EXTRACT EVERYTHING** - More is better. Include every piece of text.

2. **BE LITERAL** - Copy text exactly as written, including spelling errors, punctuation.

3. **NOTE COLORS** - Red/pink ink is usually teacher. Blue/black is usually student.

4. **INDICATE UNCERTAINTY** - Use [unclear: ...] for hard-to-read text.

5. **PRESERVE STRUCTURE** - If there's a table, describe the table structure.

6. **DON'T INTERPRET YET** - Just extract. Don't decide what's important. Extract ALL.

7. **INCLUDE CONTEXT** - Note where things are located (top, bottom, margin, etc.)

8. **TRANSCRIBE IN ORIGINAL LANGUAGE** - Keep German text in German.

## BEGIN EXTRACTION:

Look at each page carefully and extract everything. Start with Page 1.`;

/**
 * Shorter version for faster processing (still comprehensive)
 */
export const VISION_EXTRACTION_PROMPT_FAST = `# EXTRACT ALL CONTENT FROM THIS SCHOOL TEST

For EACH page, extract:

1. **Page Type:** What kind of page (article, cover sheet, answers, rubric, grade sheet)

2. **All Printed Text:** Copy exactly as written

3. **All Handwriting:** 
   - Student writing (usually blue/black ink)
   - Teacher comments (usually red/pink ink)
   - Note the ink color for each

4. **All Marks:** Correction symbols (R, Z, Gr, A), check marks, crosses, underlines, circles

5. **Grade Information:** Any "Note:", numbers 1-6, point totals like "35/100"

6. **Names & Dates:** Student name, dates, class

7. **Teacher Comments:** Main feedback, margin notes, any written comments

FORMAT:
---
PAGE 1:
Type: [type]
Printed: [all printed text]
Handwriting (blue/black): [student writing]
Handwriting (red/pink): [teacher writing]
Marks: [list all]
Grade info: [any grade-related text]
Names/Dates: [any found]
---
PAGE 2:
[continue...]
---

Extract EVERYTHING. Miss nothing. Be complete.`;

export default {
  VISION_EXTRACTION_SYSTEM,
  VISION_EXTRACTION_PROMPT,
  VISION_EXTRACTION_PROMPT_FAST
};