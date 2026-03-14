# User Flow: Generate Report from Uploaded Document

This document describes the complete user flow when a parent uploads a document to generate a report.

## Flow Steps

1. **The user uploads their file.**

2. The system performs an **initial check** (file format, size, basic readability).  
   **Appendix of error messages** is used here (loaded from `error_messages.json`).  
   If the check fails, the **Error Router** immediately returns the exact user-friendly message (supporting all languages the system covers: German, English, Arabic, Persian, Kurdish Sorani, Kurdish Kurmanji, Turkish, Romanian, Russian) from the appendix and stops the flow.

3. The **Vision Extraction Agent** converts the file into structured JSON (pages + text + confidence scores).

4. The **Verification Agent** performs a full check:  
   - Is this actually a **graded exam sheet**? (must contain at least one teacher grade / score / comment – multiple pages allowed)  
   - Does it belong to the **correct child**? (check student name, subject/grade match with profile)  
   - Quality sufficient?  
   
   **Appendix of error messages** is used here (same `error_messages.json`).  
   If anything fails → **Error Router** sends the precise message from the appendix + “Try again” button.  
   *(This enforces the core value: helping parents understand the teacher’s point of view.)*

5. **Core Analysis Agent** generates the main report:  
   - Key insight at a glance  
   - Teacher comment  
   - Strengths / Areas for improvement  
   - Recommendation  
   
   The report is **always generated in German**.  
   The system saves the original German report in the database.

6. The system checks the user’s **preferred language** (from profile/UI).  
   **Performance recommendation (applied here):** If the user’s preferred language is already known at creation time, the **Translation Agent** immediately generates **both versions** (German original + user language) in one go and saves them.  
   Both versions are stored in the database.  
   Future visits pull directly from DB — zero re-translation.

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
**Last updated**: 14 March 2026

