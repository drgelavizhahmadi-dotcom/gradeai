# Manual Testing Plan for P0/P1 Changes

**Date:** March 13, 2026  
**Build Status:** ✅ Successful (npm run build)  
**Test Scope:** P0 (must-have) + P1 (before production)

---

## Quick Start

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Keep available for curl/API testing
# Use for rate limit, retry, and API validation tests
```

Server will run on `http://localhost:3000`

---

## P0 Tests (Critical - Must Pass Before Merge)

### Test 1: Upload Empty/Invalid File
**Priority:** 🔴 CRITICAL  
**Purpose:** Validate client-side and server-side file validation

**Steps:**
1. Open upload page: `http://localhost:3000/dashboard/upload`
2. Try to upload a `.txt` file or `.docx` file
3. Observe error message

**Expected Result:**
- ✅ Client validation prevents upload (red error message appears)
- ✅ No HTTP request is made to `/api/upload`
- ✅ Error message is clear: "Only JPG, PNG and PDF files are supported"

**If Failed:** Check `UploadZone.tsx` file validation logic

---

### Test 2: Upload File > 4MB
**Priority:** 🔴 CRITICAL  
**Purpose:** Validate file size limits

**Steps:**
1. Create a large image file (> 4MB) or use online tool to generate
2. Try to upload via `http://localhost:3000/dashboard/upload`
3. Check browser DevTools → Network tab

**Expected Result:**
- ✅ Client shows error: "File must be smaller than 4.5 MB"
- ✅ If client bypass (DevTools manipulation), server returns 400
- ✅ No DB record created
- ✅ No storage upload attempted

**Test Command (curl):**
```bash
# Create a 5MB file
dd if=/dev/zero of=/tmp/large.jpg bs=1M count=5

# Try upload (will fail with 400)
curl -X POST http://localhost:3000/api/upload \
  -F "files=@/tmp/large.jpg" \
  -F "childId=test-child-id" \
  -H "Cookie: [your-auth-cookie]"
```

---

### Test 3: Upload Success → Extract → Report Flow
**Priority:** 🔴 CRITICAL  
**Purpose:** Validate happy path works end-to-end

**Steps:**
1. Go to `http://localhost:3000/dashboard/upload`
2. Select a valid test image (JPG/PNG with text)
3. Click "Analyze"
4. Watch progress stepper (Upload → Extract → Report → Done)
5. Wait for redirect to `/uploads/{uploadId}`

**Expected Result:**
- ✅ Step 1 (Upload): Completes in < 2 seconds
- ✅ Step 2 (Extract): Runs vision OCR, completes in 5-15 seconds
- ✅ Step 3 (Report): Runs Claude analysis, completes in 10-20 seconds
- ✅ Redirect to upload details page with grade, report, feedback
- ✅ DB upload record has `analysisStatus: 'completed'`

**Verify in DB:**
```bash
# Check upload status (requires DB access)
psql $DATABASE_URL -c "SELECT id, analysisStatus, grade, processedAt FROM uploads ORDER BY createdAt DESC LIMIT 1;"
```

---

### Test 4: Storage Cleanup on Upload Failure
**Priority:** 🔴 CRITICAL  
**Purpose:** Verify orphaned files are deleted when upload fails mid-way

**Steps:**
1. Add a mock failure to `/api/upload` (simulate page 2 upload failure)
   - Edit `app/api/upload/route.ts` temporarily
   - Modify the loop to throw error on page 2: `if (i === 1) throw new Error('Simulated failure')`
2. Upload 2+ images
3. Observe error: "Failed to upload files to storage"
4. Check storage bucket (GCS console or via CLI)

**Expected Result:**
- ✅ Upload record created with `analysisStatus: 'failed'`
- ✅ `errorMessage: 'Failed to upload page 2: ...'`
- ✅ NO files remain in GCS bucket for that uploadId
- ✅ First uploaded page is deleted (cleanup ran)

**Verify Storage Cleanup:**
```bash
# List files in GCS bucket
gsutil ls gs://your-bucket/uploads/
# Should NOT see the uploadId directory or only have empty entries
```

---

### Test 5: Extract API Validation (Zod Schema)
**Priority:** 🟠 HIGH  
**Purpose:** Verify Zod validation catches invalid requests

**Test Case 5a: Missing uploadId**
```bash
curl -X POST http://localhost:3000/api/analyze/extract \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{"images": [], "language": "de"}'
```

**Expected:** 400 error with message about uploadId

**Test Case 5b: Empty images array**
```bash
curl -X POST http://localhost:3000/api/analyze/extract \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{"uploadId": "test-123", "images": []}'
```

**Expected:** 400 error with message about images array

**Test Case 5c: Invalid language**
```bash
curl -X POST http://localhost:3000/api/analyze/extract \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{"uploadId": "test-123", "images": [{"base64": "...", "mimeType": "image/jpeg", "pageNumber": 1}], "language": "xx"}'
```

**Expected:** 400 error with message about invalid language

---

### Test 6: Report API Validation (Zod Schema)
**Priority:** 🟠 HIGH  
**Purpose:** Verify report endpoint validates input

**Test Case: Missing uploadId**
```bash
curl -X POST http://localhost:3000/api/analyze/report \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{}'
```

**Expected:** 400 error with validation message

---

### Test 7: Rate Limiting on Extract API
**Priority:** 🟠 HIGH  
**Purpose:** Verify per-IP rate limiting works (20 requests/min)

**Steps:**
1. Write a simple loop to call `/api/analyze/extract` 25 times rapidly
2. Monitor responses

**Test Script:**
```bash
#!/bin/bash
for i in {1..25}; do
  curl -s -X POST http://localhost:3000/api/analyze/extract \
    -H "Content-Type: application/json" \
    -H "Cookie: [auth-cookie]" \
    -d '{"uploadId": "test", "images": []}' \
    -w "Status: %{http_code}\n"
  sleep 0.1
done
```

**Expected Result:**
- ✅ First 20 requests: 400 or 200 (normal validation/processing)
- ✅ Requests 21-25: **429 Too Many Requests**
- ✅ 429 response includes `Retry-After` header

**Verify in logs:**
```
[Extract API] Rate limit exceeded for IP: 127.0.0.1
```

---

### Test 8: Retry API Endpoint - No Extracted Text
**Priority:** 🔴 CRITICAL  
**Purpose:** Verify retry logic detects missing extraction and requests re-upload

**Setup:** Create a failed upload with no `extractedText` (manually in DB or via test)

**Test:**
```bash
curl -X POST http://localhost:3000/api/analyze/retry \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{"uploadId": "upload-with-no-extraction"}'
```

**Expected:**
- ✅ 400 status code
- ✅ Response: `{"success": false, "error": "Extraction data missing. Please re-upload the files.", "needsReupload": true}`
- ✅ Upload record unchanged (still `failed`)

---

### Test 9: Retry API Endpoint - Has Extraction, No Analysis
**Priority:** 🔴 CRITICAL  
**Purpose:** Verify retry regenerates report from existing extraction

**Setup:**
1. Complete upload → extract flow successfully
2. Manually break the report by setting `analysisStatus: 'failed'` and `analysis: null` in DB
3. Keep `extractedText` intact

**Test:**
```bash
curl -X POST http://localhost:3000/api/analyze/retry \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{"uploadId": "upload-with-extraction-only"}'
```

**Expected:**
- ✅ 200 status code
- ✅ Response includes `"status": "completed"` and grade
- ✅ DB upload now has `analysisStatus: 'completed'`, `analysis: {...}`, `errorMessage: null`
- ✅ No re-upload or re-extraction required

**Verify in DB:**
```bash
psql $DATABASE_URL -c "SELECT id, analysisStatus, errorMessage, analysis FROM uploads WHERE id = 'upload-with-extraction-only';"
```

---

### Test 10: Retry API - Already Completed Upload
**Priority:** 🟠 HIGH  
**Purpose:** Verify retry endpoint handles idempotent success

**Test:**
```bash
curl -X POST http://localhost:3000/api/analyze/retry \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{"uploadId": "already-completed-upload"}'
```

**Expected:**
- ✅ 200 status code
- ✅ Response: `{"success": true, "status": "completed", "message": "Upload already completed"}`

---

### Test 11: Retry API - Only Failed Status Allowed
**Priority:** 🟠 HIGH  
**Purpose:** Verify retry rejects non-failed uploads

**Test:**
```bash
curl -X POST http://localhost:3000/api/analyze/retry \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-cookie]" \
  -d '{"uploadId": "pending-upload"}'
```

**Expected:**
- ✅ 400 status code
- ✅ Response: `{"success": false, "error": "Cannot retry status: pending"}`

---

### Test 12: Authorization - Cannot Retry Other User's Upload
**Priority:** 🔴 CRITICAL  
**Purpose:** Verify auth prevents cross-user access

**Setup:**
1. Login as User A
2. Get User B's failed uploadId (somehow - DB or API leak)
3. Try to retry it

**Test:**
```bash
curl -X POST http://localhost:3000/api/analyze/retry \
  -H "Content-Type: application/json" \
  -H "Cookie: [user-a-auth]" \
  -d '{"uploadId": "user-b-upload-id"}'
```

**Expected:**
- ✅ 404 status code
- ✅ Response: `{"success": false, "error": "Upload not found"}`
- ✅ No error message reveals it belongs to another user

---

### Test 13: Database Transaction Safety (Concurrency)
**Priority:** 🟠 HIGH  
**Purpose:** Verify concurrent retries don't cause race conditions

**Setup:**
1. Create a failed upload with extraction but no analysis
2. Open two terminals with different auth sessions

**Test:**
```bash
# Terminal 1
curl -X POST http://localhost:3000/api/analyze/retry \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-1]" \
  -d '{"uploadId": "shared-upload"}' &

# Terminal 2 (simultaneously)
curl -X POST http://localhost:3000/api/analyze/retry \
  -H "Content-Type: application/json" \
  -H "Cookie: [auth-2]" \
  -d '{"uploadId": "shared-upload"}' &

wait
```

**Expected:**
- ✅ First request succeeds (200)
- ✅ Second request fails (403/404 or receives completed status)
- ✅ DB shows only ONE report generated (no duplicates)

**Verify in DB:**
```bash
psql $DATABASE_URL -c "SELECT id, analysisStatus, processedAt FROM uploads WHERE id = 'shared-upload';"
```

---

### Test 14: Report Generation with Exponential Backoff
**Priority:** 🟠 HIGH  
**Purpose:** Verify Claude API retry logic handles transient failures

**Setup:** This test requires simulating AI API failure

**Manual Test:**
1. Monitor report generation in logs
2. Look for retry attempts on transient errors

**Expected in Logs:**
```
[Claude Report] Sending request (attempt 1)...
[Claude Report] Attempt 1 failed: API timeout
[Claude Report] Waiting 1000ms before retrying...
[Claude Report] Sending request (attempt 2)...
[Claude Report] Complete
```

---

## P1 Tests (Important - Before Production)

### Test 15: Background Job - Timeout Recovery
**Priority:** 🟠 HIGH  
**Purpose:** Verify abandoned uploads are marked failed

**Setup:**
1. Create an upload stuck in `extracting` state
2. Set `uploadedAt` to > 30 minutes ago (mock in DB)
3. Manually call background job

**Manual Test (requires code execution):**
```typescript
// In Node REPL or test script
import { recoverAbandonedUploads } from '@/lib/background-jobs'

const result = await recoverAbandonedUploads()
console.log(result) // Should show recovered count
```

**Expected:**
- ✅ Upload marked as `failed`
- ✅ `errorMessage: 'Processing timeout after X minutes'`
- ✅ Logs show recovery attempt

---

### Test 16: Idempotency Key Header
**Priority:** 🟠 HIGH  
**Purpose:** Verify idempotency prevents duplicate processing

**Test:**
```bash
# First request with idempotency key
curl -X POST http://localhost:3000/api/analyze/extract \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -H "Cookie: [auth-cookie]" \
  -d '{"uploadId": "test", "images": [...]}'

# Exact same request (should return cached result)
curl -X POST http://localhost:3000/api/analyze/extract \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -H "Cookie: [auth-cookie]" \
  -d '{"uploadId": "test", "images": [...]}'
```

**Expected:**
- ✅ Both responses identical
- ✅ Only ONE AI API call made (second uses cached result)
- ✅ Logs show: `[Idempotency] Stored result for key: test-key-123`

---

## UI/UX Manual Tests

### Test 17: Error Message Display on Upload Failure
**Priority:** 🟠 HIGH  
**Purpose:** Verify UI shows user-friendly error

**Steps:**
1. Go to upload page
2. Simulate upload failure (disconnect network mid-upload)
3. Observe error panel

**Expected:**
- ✅ Red error box appears
- ✅ Shows which step failed (e.g., "Upload failed")
- ✅ Shows Retry and Start Over buttons
- ✅ Progress stepper remains visible (not hidden)

---

### Test 18: Retry Button from Error State
**Priority:** 🟠 HIGH  
**Purpose:** Verify retry flow resumes from failed step

**Steps:**
1. From Test 17 error state, click "Retry"
2. Observe if upload is skipped (should be)
3. Extraction should start immediately

**Expected:**
- ✅ Upload step is SKIPPED (no re-upload)
- ✅ Extraction step runs
- ✅ Report generation follows

---

### Test 19: Responsive Mobile Testing
**Priority:** 🟢 MEDIUM  
**Purpose:** Verify mobile experience works

**Steps:**
1. Open DevTools → Device Toolbar (iPhone 12)
2. Go through upload flow
3. Check error states

**Expected:**
- ✅ All buttons are touchable (44x44px minimum)
- ✅ No layout overflow
- ✅ Text readable
- ✅ Progress stepper displays correctly

---

### Test 20: Accessibility - Keyboard Navigation
**Priority:** 🟢 MEDIUM  
**Purpose:** Verify keyboard-only navigation works

**Steps:**
1. Use only Tab key to navigate UploadZone
2. Use Enter to activate buttons
3. Try Retry button with keyboard

**Expected:**
- ✅ Focus visible on all buttons
- ✅ Can activate Upload, Retry, Start Over with Enter
- ✅ Can remove files with keyboard

---

## Summary Checklist

### P0 - Must Pass Before Merge ✅
- [ ] Test 1: File validation (invalid types)
- [ ] Test 2: File size limit (> 4MB)
- [ ] Test 3: Happy path (Upload → Extract → Report)
- [ ] Test 4: Storage cleanup on failure
- [ ] Test 5: Extract API Zod validation
- [ ] Test 6: Report API Zod validation
- [ ] Test 7: Rate limiting (429 after limit)
- [ ] Test 8: Retry without extraction (needsReupload: true)
- [ ] Test 9: Retry with extraction (regenerates report)
- [ ] Test 10: Retry already completed
- [ ] Test 11: Retry wrong status
- [ ] Test 12: Authorization check
- [ ] Test 13: Concurrency safety
- [ ] Test 14: Exponential backoff in logs

### P1 - Before Production ✅
- [ ] Test 15: Timeout recovery background job
- [ ] Test 16: Idempotency key caching
- [ ] Test 17: Error UI display
- [ ] Test 18: Retry button flow
- [ ] Test 19: Mobile responsiveness
- [ ] Test 20: Keyboard accessibility

---

## Issues Found & Actions

| Test | Status | Issue | Action |
|------|--------|-------|--------|
|      |        |       |        |

---

**Tester:** [Your Name]  
**Date:** [Test Date]  
**Signature:** ___________________
