# Validation Rules – Error Codes & Trigger Conditions

**Purpose of this document**  
This file documents **all validation rules** used when processing uploaded exam documents.  
It explains:

- each error code
- the business / user-experience reason behind it
- the concrete conditions that should trigger it
- primary location in the flow where the check should happen

This is **not** executable code — it is guidance for developers, QA, product, and future onboarding.

Last updated: March 2026  
Related files:  
- `error_messages.json` (user-facing messages in all languages)  
- `knowledge.md` (high-level user flow)

## Error Codes Overview

| Code   | Short name                          | Severity | Most common cause                          | User impact if ignored                     | Priority |
|--------|-------------------------------------|----------|--------------------------------------------|--------------------------------------------|----------|
| ERR_01 | Wrong input – unrelated document    | High     | Completely wrong file type                 | Wrong / hallucinated report                | ★★★★★    |
| ERR_02 | Incomplete pages                    | High     | Forgot to photograph last page(s)          | Missing questions / grades / comments      | ★★★★☆    |
| ERR_03 | Blurry / low-quality photos         | High     | Bad lighting, shaky hand, low resolution   | Unreadable text → inaccurate analysis      | ★★★★★    |
| ERR_04 | Wrong file format                   | Medium   | .heic, .docx, video, etc.                  | Processing fails completely                | ★★★☆☆    |
| ERR_05 | Mixed exams / pages                 | High     | Multiple tests uploaded together           | Confused strengths/weaknesses report       | ★★★★☆    |
| ERR_06 | Uploaded answer key / solution      | High     | Parent scanned teacher model answers       | Report shows 100% correct (useless)        | ★★★★★    |
| ERR_07 | No teacher grade / comment visible  | Critical | Ungraded draft / photo of empty paper      | Cannot fulfill core value (teacher's view) | ★★★★★    |
| ERR_08 | Page content cut off / folded       | High     | Finger over text, bad crop, folded paper   | Missing answers / grade / feedback         | ★★★★☆    |
| ERR_09 | Wrong child / grade / subject       | Medium   | Wrong profile selected / sibling's paper   | Report for wrong student                   | ★★★☆☆    |
| ERR_10 | File too large / corrupted upload   | Medium   | Network issue, huge scan                   | Processing fails or very slow              | ★★★☆☆    |

## Detailed Trigger Conditions

### ERR_01 – Wrong input (unrelated document)
**When to trigger**  
Content does not resemble any school exam/test/quiz structure.

**Typical signals**
- No numbered questions
- No subject title, date, name field, class/grade field
- OCR detects mostly non-educational text (shopping list, recipe, timetable, certificate, book page, social media screenshot, etc.)

**Primary check location**  
Vision Extraction Agent + early Verification Agent

### ERR_02 – Incomplete pages
**When to trigger**  
System detects evidence that more pages should exist.

**Typical signals**
- Page numbers detected (e.g. "1/3", "Seite 2 von 4")
- Question numbering jumps (e.g. questions 1–5 on page 1, then 11–15 on page 2)
- Layout shows "Fortsetzung auf nächster Seite" / "continued…"
- Last page ends mid-sentence or mid-table

**Primary check location**  
Verification Agent (after all pages extracted)

### ERR_03 – Blurry / low-quality photos
**When to trigger**  
Text cannot be reliably extracted or confidence is too low.

**Typical signals**
- Average OCR confidence per page < ~0.75–0.82 (exact threshold to tune)
- Image sharpness / contrast metrics low
- Heavy moiré pattern, shadows covering text, overexposure

**Primary check location**  
Vision Extraction Agent (per-page confidence)

### ERR_04 – Wrong file format
**When to trigger**  
File type not in whitelist.

**Typical signals**
- Extension or MIME type ≠ pdf, jpg, jpeg, png
- Should ideally be blocked at upload — this is a fallback

**Primary check location**  
Upload handler / initial system check (step 2)

### ERR_05 – Mixed exams / pages
**When to trigger**  
Pages do not appear to belong to the same document.

**Typical signals**
- Multiple different handwriting styles
- Different dates / form layouts / question fonts across pages
- Subject title changes mid-upload
- Inconsistent page numbering direction

**Primary check location**  
Verification Agent

### ERR_06 – Uploaded answer key / solution
**When to trigger**  
Document strongly matches characteristics of official solutions.

**Typical signals**
- Keywords: Musterlösung, Lösungsvorschlag, Korrektur, Beispiel, Notenschlüssel
- Very clean layout, no student handwriting variability
- Perfect answers with point allocation but no student attempt visible
- Teacher-like red pen / stamps on model answers

**Primary check location**  
Verification Agent + Core Analysis Agent (double-check)

### ERR_07 – No teacher grade / comment visible
**When to trigger**  
No evidence of teacher evaluation found.

**Typical signals**
- No numeric score, points, grade (1–6, A–F, etc.)
- No phrases like "Note:", "Punkte:", "gut", "mangelhaft"
- No red ink, circles, underlines, teacher stamps, written feedback

**Primary check location**  
Verification Agent (critical gate)

### ERR_08 – Page content cut off / folded
**When to trigger**  
Important content is not fully visible.

**Typical signals**
- OCR finds incomplete words/sentences at page edges
- Page boundary detection shows truncation
- Finger/hand/object covering parts of answers/grade

**Primary check location**  
Vision Extraction Agent + Verification Agent

### ERR_09 – Wrong child / grade / subject
**When to trigger**  
Detected document context mismatches user profile.

**Typical signals**
- Extracted student name ≠ profile name (high confidence match)
- Detected subject/grade/year does not match profile settings

**Primary check location**  
Verification Agent (after name/subject extraction)

### ERR_10 – File too large / corrupted upload
**When to trigger**  
Technical problem with the file itself.

**Typical signals**
- File size > configured limit (e.g. 25–50 MB)
- Cannot open/parse file
- Upload interrupted / partial file received

**Primary check location**  
Upload handler / initial system check (step 2)

## Recommendations

- **Order of checks** (cheapest → expensive):  
  1. File format & size (ERR_04, ERR_10)  
  2. Image quality (ERR_03)  
  3. Is it exam-like? (ERR_01)  
  4. Content completeness (ERR_02, ERR_08)  
  5. Teacher evaluation present? (ERR_07)  
  6. Looks like solution? (ERR_06)  
  7. Pages consistent? (ERR_05)  
  8. Matches profile? (ERR_09)

- **Most painful user experiences to prevent** (highest priority):  
  ERR_03, ERR_06, ERR_07

- **Tuning tip**: Start with conservative thresholds (e.g. OCR confidence 0.80) and lower them gradually while monitoring false negatives/positives.

- **Future possible extensions**: ERR_11 (handwriting too messy), ERR_12 (watermark/stamp covers grade), etc.

