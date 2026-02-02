# Google Document AI Setup Guide

## Overview
Google Document AI provides enterprise-grade OCR with higher accuracy than basic Vision API. This guide will help you set up Document AI as the primary OCR provider for GradeAI.

## Prerequisites
- Google Cloud Project (you already have: `gradeai-484000`)
- Google Cloud credentials (already configured)
- Document AI API enabled

## Step 1: Enable Document AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `gradeai-484000`
3. Go to "APIs & Services" → "Library"
4. Search for "Document AI API"
5. Click "Enable"

## Step 2: Create a Document AI Processor

1. In Google Cloud Console, go to "Document AI" (search in the top search bar)
2. Click "Create Processor"
3. Choose "Document OCR" as the processor type
4. Name it something like "GradeAI-OCR"
5. Select your preferred location (default: `us`)
6. Click "Create"

## Step 3: Get Your Processor ID

After creating the processor:
1. Go to the "Processors" tab in Document AI
2. Click on your newly created processor
3. Copy the "Processor ID" from the processor details
4. It will look something like: `projects/gradeai-484000/locations/us/processors/12345678-1234-1234-1234-123456789012`

**You only need the ID part after the last slash, e.g.: `12345678-1234-1234-1234-123456789012`**

## Step 4: Update Environment Variables

Add this to your `.env.local` file:

```bash
# Google Document AI Configuration
GOOGLE_CLOUD_PROJECT_ID=gradeai-484000
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=your-processor-id-here
GOOGLE_CLOUD_LOCATION=us
```

## Step 5: Test the Setup

Once configured, upload a test image to verify Document AI is working. You should see logs like:
```
[Document AI] Starting extraction...
[Document AI] Config check:
[Document AI] - Project ID: SET
[Document AI] - Location: us
[Document AI] - Processor ID: SET
[Document AI] Processing page 1...
[Document AI] Page 1 confidence: 95.2%
```

## Troubleshooting

### "Processor not found" error
- Double-check the processor ID
- Ensure the processor was created in the correct location
- Verify the service account has access to Document AI

### Still getting 0% confidence
- Check that Document AI API is enabled
- Verify the processor is active
- Check Google Cloud billing is enabled (Document AI requires billing)

### API Quotas
Document AI has quotas. Check your usage in Google Cloud Console → Document AI → Quotas.

## Cost Information
- Document AI charges per page processed
- First 1,000 pages/month are free
- Additional pages: ~$0.005 per page
- Much more accurate than Vision API for documents</content>
<parameter name="filePath">c:\Users\geli1\gradeai\GOOGLE-DOCUMENT-AI-SETUP.md