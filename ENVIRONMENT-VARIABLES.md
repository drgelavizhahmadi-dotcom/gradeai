# Environment Variables Quick Reference

## Required Variables for Production

Copy this template to your production environment and fill in the values:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Google Gemini Vision API (Primary - for multi-expert analysis)
GEMINI_API_KEY=your-gemini-api-key-here

# Google Cloud Vision API (for OCR)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-32-character-secret-here

# Environment (set automatically by hosting)
NODE_ENV=production
```

## How to Get Each Variable

### GEMINI_API_KEY (Primary - Required)
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza`)
5. **Cost:** FREE tier includes 1,500 requests/day
6. **Used for:** Triple Vision AI analysis of handwritten tests

### DATABASE_URL
1. Sign up for a PostgreSQL hosting provider:
   - Railway: https://railway.app
   - Supabase: https://supabase.com
   - Neon: https://neon.tech
2. Create a new PostgreSQL database
3. Copy the connection string provided

### GOOGLE_APPLICATION_CREDENTIALS (Optional - for advanced OCR)
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Cloud Vision API"
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Create service account and download JSON key file
6. Upload the JSON file to your server
7. Set this variable to the absolute path of the JSON file

### NEXTAUTH_URL
- Development: `http://localhost:3000`
- Production: Your actual domain (e.g., `https://gradeai.com`)

### NEXTAUTH_SECRET
Generate a secure random string:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Security Checklist

- [ ] All environment variables are set in production
- [ ] `.env.local` is NOT committed to git
- [ ] `google-credentials.json` is NOT committed to git
- [ ] `NEXTAUTH_SECRET` is at least 32 characters
- [ ] Database password is strong and unique
- [ ] API keys are kept secure and rotated regularly
- [ ] Production uses HTTPS (not HTTP)

## Verifying Setup

After setting environment variables, test each component:

1. **Database Connection**
   ```bash
   npx prisma db push
   ```

2. **Anthropic API**
   - Upload a test and check if AI analysis completes

3. **Google Vision API**
   - Upload a test image and check if OCR extracts text

4. **Authentication**
   - Try to register and log in

## Troubleshooting

**Error: "ANTHROPIC_API_KEY is not set"**
- Ensure the variable is set in your environment
- Restart your application after setting

**Error: "Cannot find google-credentials.json"**
- Check the file path is absolute (not relative)
- Verify the file exists and is readable
- Check file permissions

**Error: "Cannot connect to database"**
- Verify DATABASE_URL format
- Check database accepts connections from your server
- Test connection with: `npx prisma db push`

**Error: "Unauthorized: You must be logged in"**
- This is expected for protected routes
- Not expected for `/api/analyze` (internal endpoint)
- Check authentication status in DEPLOYMENT-CHECKLIST.md

## Cost Estimates

### Anthropic Claude API
- Model: Claude 3 Haiku
- ~$0.25 per 1M input tokens
- ~$1.25 per 1M output tokens
- Estimated: ~$0.01-0.05 per analysis

### Google Cloud Vision API
- First 1,000 detections/month: FREE
- After: ~$1.50 per 1,000 detections
- Estimated: FREE for most users

### Database
- Small instance: $5-20/month
- Scales with data size

**Total estimated monthly cost for 100 analyses: ~$5-25**
(Mostly database hosting, API usage is minimal)
