# Analyze API Endpoint

API endpoint for analyzing uploaded school assignments using OCR and text parsing.

## Endpoint

`POST /api/analyze`

## Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "uploadId": "string"
}
```

## Response

### Success (200)
```json
{
  "success": true,
  "uploadId": "clfx...",
  "data": {
    "extractedText": "Full OCR text...",
    "parsed": {
      "grade": "2-",
      "gradeNumeric": 2.3,
      "subject": "Mathematik",
      "teacherComment": "Sehr gute Arbeit..."
    },
    "analysis": {
      "parsedAt": "2024-01-11T10:30:00Z",
      "confidence": "medium",
      "extractedData": {
        "grade": "2-",
        "gradeNumeric": 2.3,
        "subject": "Mathematik",
        "teacherComment": "Sehr gute Arbeit..."
      }
    }
  }
}
```

### Error (400, 404, 500)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Process Flow

1. **Validate Request** - Checks that uploadId is provided
2. **Fetch Upload** - Retrieves upload record with child and user relations
3. **Update Status** - Sets `analysisStatus` to "processing"
4. **Read File** - Loads the file from disk using the `fileUrl`
5. **Extract Text** - Uses Google Cloud Vision OCR to extract text
6. **Parse Data** - Parses German test format to extract:
   - Grade (e.g., "2-", "3+", "2,5")
   - Subject (Mathematik, Deutsch, etc.)
   - Teacher comment (after "Bemerkung:", etc.)
7. **Convert Grade** - Converts German notation to numeric (2- → 2.3)
8. **Update Database** - Saves extracted data and sets status to "completed"
9. **Return Results** - Returns comprehensive analysis data

## Error Handling

If any step fails:
- Sets `analysisStatus` to "failed"
- Stores error message in `errorMessage` field
- Returns 500 error response with details
- Comprehensive logging throughout

## Database Updates

The endpoint updates the `Upload` model with:
- `analysisStatus`: "processing" → "completed" or "failed"
- `extractedText`: Full OCR text
- `subject`: Detected subject
- `grade`: Numeric grade (1.0-6.0)
- `teacherComment`: Extracted comment
- `analysis`: JSON with full analysis data
- `processedAt`: Timestamp when completed
- `errorMessage`: Error details if failed

## Example Usage

```typescript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    uploadId: 'clfx1234567890',
  }),
})

const result = await response.json()

if (result.success) {
  console.log('Grade:', result.data.parsed.grade)
  console.log('Subject:', result.data.parsed.subject)
} else {
  console.error('Error:', result.error)
}
```

## Logging

The endpoint provides comprehensive logging:
- `[Analyze API]` prefix for all logs
- Request received and uploadId
- Upload details (file, child, user)
- Status updates
- File reading progress
- OCR extraction progress
- Parsing results
- Database updates
- Error details

## Dependencies

- `@prisma/client` - Database operations
- `@/lib/ocr` - Text extraction and parsing
- `@/lib/ocr/gradeConverter` - Grade conversion utilities
- `fs` - File system operations
- `path` - Path resolution
