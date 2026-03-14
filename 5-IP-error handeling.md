# Error Handling & Recovery UX — Implementation Plan

When users upload a test, the system runs **Upload → Extract → Report**. Currently, errors show a generic message with **no retry, no step guidance, and no way to resume**. This plan adds step-aware error handling with retry capability so users always know what went wrong and can recover.

## Current State

- [UploadZone.tsx](file:///c:/Users/zbeig/Code/gradeai/components/UploadZone.tsx) catches all errors in a single try/catch (line 642–647) and shows a red error box with no recovery options
- The progress stepper **disappears** on error (`processingStep === "error"`)
- Dashboard/child profile show a "Failed" badge but no retry action
- `analysisStatus` flows: `pending` → `extracting` → `analyzing` → `completed` / `failed`
- The **report API** never sets `analysisStatus: "failed"` — the catch block returns 500 without updating the DB
- `errorMessage` field exists on the [Upload](file:///c:/Users/zbeig/Code/gradeai/app/dashboard/page.tsx#38-48) model but is only set by the extract API
- Dashboard/child profile show confusing Pending/Processing badges — users don't need to see intermediate states

## Proposed Changes

### UploadZone Component

#### [MODIFY] [UploadZone.tsx](file:///c:/Users/zbeig/Code/gradeai/components/UploadZone.tsx)

**1. Add retry state tracking:**
- New state: `failedStep: "uploading" | "extracting" | "analyzing" | null`
- New state: `retryContext: { uploadId: string; images: array } | null` — stores context so we can skip completed steps

**2. Step-aware error UI (replace lines 660–672):**
- Keep the progress stepper visible on error — highlight the failed step in red
- Show which step failed + step-specific guidance tip:
  - Upload failed → "Please check your connection and try again"
  - Extract failed → "Your files were uploaded successfully. Click Retry to re-run the analysis — no re-upload needed"
  - Report failed → "Text was extracted successfully. Click Retry to regenerate the report"
- Show **Retry** button (resumes from failed step) or **Start Over** button (resets everything)

**3. Implement `handleRetry()` function:**
- If `failedStep === "uploading"` → reset all state, let user re-select files
- If `failedStep === "extracting"` → skip upload, call `/api/analyze/extract` with stored `retryContext`
- If `failedStep === "analyzing"` → skip upload + extract, call `/api/analyze/report` with stored `uploadId`

**4. Update catch block (line 642–647):**
- Detect which step failed based on current `processingStep` and set `failedStep` accordingly
- Store `retryContext` with `uploadId` and `images` for later retry

**5. Add translations** for new keys (`retryBtn`, `startOverBtn`, `retryTipUpload`, `retryTipExtract`, `retryTipReport`) in all 9 languages (de, en, ar, tr, ro, ru, fa, ku, kmr)

---

### Report API — Fix Missing Failed Status

#### [MODIFY] [route.ts](file:///c:/Users/zbeig/Code/gradeai/app/api/analyze/report/route.ts)

Currently the catch block (line 95–104) returns `{ success: false }` but **never updates the upload record** to `analysisStatus: "failed"`. This means failed reports stay stuck in `"analyzing"` status forever.

**Fix:** In the catch block, update the upload record with `analysisStatus: "failed"` and `errorMessage` before returning the error response. Mirror the pattern already used in the extract API.

---

### Dashboard — Simplify Upload List & Add Retry

#### [MODIFY] [page.tsx](file:///c:/Users/zbeig/Code/gradeai/app/dashboard/page.tsx)

**Simplify visible statuses — users should only see two actionable states:**
- **Completed** → clickable to view the report (existing behavior)
- **Failed** → show retry button that navigates to `/dashboard/upload?retry={uploadId}`
- **Pending / Processing / Extracting / Analyzing** → **hide from the list entirely**. The user can leave during processing and come back later; these uploads will appear once they reach Completed or Failed.

**Changes:**
- Filter the uploads list to only show `analysisStatus === 'completed'` or `analysisStatus === 'failed'`
- Remove the Pending/Processing status badges from [getStatusBadge()](file:///c:/Users/zbeig/Code/gradeai/app/dashboard/page.tsx#134-173) (or simplify to only handle `completed` and `failed`)
- Add a retry icon button next to the "Failed" badge
- Update `pendingTests` stat card: either remove it or repurpose it (e.g., show count of in-progress tests as a subtle info, not as a clickable list item)

---

### Child Profile — Same Simplification & Retry

#### [MODIFY] [page.tsx](file:///c:/Users/zbeig/Code/gradeai/app/dashboard/children/[id]/page.tsx)

- Same changes: filter uploads to only show Completed and Failed
- Add retry button next to Failed badge
- Hide in-progress uploads from the list

---

### Retry API Endpoint

#### [NEW] [route.ts](file:///c:/Users/zbeig/Code/gradeai/app/api/analyze/retry/route.ts)

Create `POST /api/analyze/retry`:
- Accepts `{ uploadId }`
- Verifies upload belongs to authenticated user
- Checks `analysisStatus` — only allows retry for `"failed"` status
- Checks if `extractedText` exists:
  - Yes → calls report generation, returns result
  - No → returns `{ needsReupload: true }` telling the client to re-upload
- Updates `analysisStatus` appropriately during processing

---

### Upload Page — Accept Retry Query Parameter

#### [MODIFY] [page.tsx](file:///c:/Users/zbeig/Code/gradeai/app/dashboard/upload/page.tsx)

- Read `?retry={uploadId}` from URL search params
- If present, pass it to [UploadZone](file:///c:/Users/zbeig/Code/gradeai/components/UploadZone.tsx#353-851) as a prop so it can auto-trigger the retry flow on mount

#### [MODIFY] [UploadZone.tsx](file:///c:/Users/zbeig/Code/gradeai/components/UploadZone.tsx)

- Accept optional `retryUploadId` prop
- On mount, if `retryUploadId` is set, call the retry API and enter the appropriate retry flow

## Verification Plan

### Existing Tests
Run the existing Jest test suite to ensure no regressions:
```
npm test
```
The tests in [__tests__/components/ui.test.tsx](file:///c:/Users/zbeig/Code/gradeai/__tests__/components/ui.test.tsx) cover UploadZone rendering, file drop, validation, and removal. These should all continue to pass.

### Manual Browser Testing

> [!IMPORTANT]
> Since error states require API failures which are hard to trigger programmatically, **manual testing is recommended**:

1. **Start dev server:** `npm run dev`
2. **Test upload error:** Upload a file, then disconnect network before upload completes — verify the error panel shows step 1 failed with "Start Over" button
3. **Test extract error:** Temporarily break the AI API key in [.env.local](file:///c:/Users/zbeig/Code/gradeai/.env.local), upload a valid file — verify error panel shows step 2 failed with "Retry" button and the tip "Your files were uploaded. Click Retry"
4. **Test report error:** Similar — but break only the report API key
5. **Test retry from dashboard:** Go to dashboard, find a failed upload, click the retry button, verify navigation to retry flow
6. **Test retry from child profile:** Same test from the child profile page
7. **Restore API keys** and verify retry completes successfully
