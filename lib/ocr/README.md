# OCR Module

This module provides text extraction from **images and PDFs** using Google Cloud Vision API and parsing capabilities for German school assignments.

## Functions

### `extractText(fileBuffer: Buffer): Promise<string>`

Extracts text from an image or PDF buffer. Automatically detects file type and uses the appropriate extraction method.

**Features:**
- Supports images (JPG, PNG) via Google Cloud Vision API OCR
- Supports PDFs (both text-based and image-based)
- Multi-page PDF support - extracts and combines text from all pages
- Automatic fallback to OCR for image-based PDFs

**Parameters:**
- `fileBuffer` - The file buffer (image or PDF)

**Returns:**
- Promise that resolves to the extracted text content (string)

**Example:**
```typescript
import { extractText } from '@/lib/ocr'
import fs from 'fs'

// Works with images
const imageBuffer = fs.readFileSync('test.jpg')
const imageText = await extractText(imageBuffer)

// Works with PDFs
const pdfBuffer = fs.readFileSync('test.pdf')
const pdfText = await extractText(pdfBuffer)
```

**How it works:**
1. Detects if file is PDF by checking file signature (`%PDF-`)
2. For PDFs:
   - First attempts direct text extraction using `pdf-parse`
   - If minimal/no text found (image-based PDF):
     - Converts each PDF page to PNG using `pdf-to-png-converter`
     - Runs OCR on each page image separately
     - Combines text from all pages with page break markers
   - Returns combined text from all pages
3. For images:
   - Uses Google Cloud Vision API directly for OCR
4. Returns extracted text content

### `parseGermanTest(text: string): ParsedTestData`

Parses German test/assignment text to extract structured information.

**Parameters:**
- `text` - The raw OCR text (string)

**Returns:**
- `ParsedTestData` object with:
  - `grade` - Extracted grade (e.g., "2-", "3+", "2.5") or null
  - `subject` - Detected subject (e.g., "Mathematik", "Deutsch") or null
  - `teacherComment` - Extracted teacher comment or null
  - `rawText` - Original input text

**Supported Grade Formats:**
- With "Note:" prefix: "Note: 2-", "Note 2,5"
- Standalone: "2+", "3-", "1.5"

**Supported Subjects:**
- Mathematik, Deutsch, Englisch, Französisch, Spanisch, Latein
- Biologie, Chemie, Physik
- Geschichte, Geografie, Erdkunde, Politik, Sozialkunde
- Religion, Ethik, Kunst, Musik, Sport, Informatik

**Comment Markers:**
- "Bemerkung:"
- "Kommentar:"
- "Anmerkung:"
- "Feedback:"

**Example:**
```typescript
import { parseGermanTest } from '@/lib/ocr'

const ocrText = `
Mathematik Klassenarbeit
Note: 2-
Bemerkung: Sehr gute Arbeit! Die Aufgaben wurden sorgfältig gelöst.
`

const parsed = parseGermanTest(ocrText)
console.log(parsed)
// {
//   grade: "2-",
//   subject: "Mathematik",
//   teacherComment: "Sehr gute Arbeit! Die Aufgaben wurden sorgfältig gelöst.",
//   rawText: "..."
// }
```

## Environment Variables

Set these in your `.env.local` file:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

## Error Handling

Both functions include proper error handling:
- `extractText` throws detailed errors if the API call fails
- `parseGermanTest` gracefully handles missing data by returning null values

All functions log their progress for debugging purposes.
