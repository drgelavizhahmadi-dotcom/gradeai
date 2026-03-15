# User Flow: Generate Report from Uploaded Document

This document describes the complete user flow when a parent uploads a document to generate a report.

## Flow Steps

1. **The user uploads their file.**

2. The system performs a **technical pre-check** to ensure processing quality:
   - **Quality Scoring**: Uses `sharp` (Laplacian variance) to detect blurry images (`ERR_03`) with a variance threshold < 40.
   - **Blank Detection**: Automatically rejects solid color or nearly blank pages (`ERR_18`).
   - **Error Routing**: Technical codes (`ERR_XX`) are resolved to localized messages using a centralized `ErrorRouter`.

3. The **Vision Extraction Agent** converts the file into structured JSON (pages + text + confidence scores).

4. The **Verification Agent** (AI-driven) performs an early sanity check before expensive report generation:
   - **Content Filter**: Rejects non-exam sheets (`ERR_01`) or technical documentation/code (`ERR_11`).
   - **Goal Alignment**: Ensures the document contains a visible grade or teacher comment (`ERR_07`).
   - **Synchronization**: `errorCode` is persisted in the database to ensure the UI remains consistent even after page refreshes.

5. **Core Analysis Agent** generates the main report:  
   - Key insight at a glance  
   - Teacher comment  
   - Strengths / Areas for improvement  
   - Recommendation  
   
   The report is **always generated in German**.  
   The system saves the original German report in the database.

6. The system checks the user’s **preferred language** and synchronizes UI feedback:
   - **Proactive Translation**: If the user's language is not German, the system translates the report once and caches it in `ReportTranslation` table.
   - **Retry Hints**: If a specific stage fails (e.g. Report extraction), the UI provides localized hints (`HINT_EXTRACT_RETRY`, `HINT_REPORT_RETRY`) so users can re-run analysis without re-uploading.

7. **Premium Sections** (Fairness Check + Personalized Learning) – triggered **only on user request**:  
   - Generated in German (same base language).  
   - Saved in DB.  
   - Same translation logic as step 6: if preferred language differs, translate once at creation time (both versions stored).  
   - Uses the same **Appendix of error messages** for any issues during premium generation.

## Key Principles

- **Base language**: All analysis and generation happens in German first (for highest accuracy on German exams).  
- **Translation caching**: Translations are created once and stored permanently in the database.  
- **Error handling**: All 10 error scenarios use the centralized `error_messages.json` file (supports all system languages).  
- **Core value**: The flow strictly requires a visible teacher grade/comment before generating any report.

---

**File**: `knowledge.md`  
**Location**: Root of project  
**Last updated**: 15 March 2026

