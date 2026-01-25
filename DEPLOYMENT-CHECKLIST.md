# Deployment Checklist for GradeAI

## 1. Environment Variables

All required environment variables are documented in `.env.example`. You need to configure these in your production environment:

### Required Variables

- **DATABASE_URL** (Required)
  - PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://postgres:password@localhost:5432/gradeai`
  - Where to get: Your PostgreSQL hosting provider (e.g., Railway, Supabase, Neon)

- **ANTHROPIC_API_KEY** (Required)
  - Anthropic Claude API key for AI analysis
  - Format: `sk-ant-api03-...`
  - Where to get: https://console.anthropic.com/
  - Used in: `lib/ai/claude.ts`

- **GOOGLE_APPLICATION_CREDENTIALS** (Required)
  - Path to Google Cloud Vision API credentials JSON file
  - Format: `/path/to/google-credentials.json`
  - Where to get: https://console.cloud.google.com/apis/credentials
  - Used in: `lib/ocr/vision.ts`
  - **Important**: Upload the credentials JSON file to your server and update this path

- **NEXTAUTH_URL** (Required)
  - Full URL where your application is hosted
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`
  - Used in: NextAuth configuration and internal API calls

- **NEXTAUTH_SECRET** (Required)
  - Secret key for encrypting JWT tokens (minimum 32 characters)
  - Generate with: `openssl rand -base64 32`
  - Must be unique and kept secret
  - Used in: `lib/auth.ts`

### Optional Variables

- **NODE_ENV**
  - Set to `production` for production deployments
  - Automatically set by most hosting platforms
  - Affects: Logging verbosity, Prisma query logging

## 2. Security Checklist

### Files Protected by .gitignore

✅ `.env.local` - Local environment variables
✅ `.env` - Environment variables
✅ `/tmp` - Uploaded test files
✅ `google-credentials.json` - Google Cloud credentials
✅ `node_modules` - Dependencies
✅ `.next` - Build cache

### Verified Security Measures

✅ **No hardcoded API keys** in source code
✅ **No hardcoded secrets** in source code
✅ **No hardcoded database credentials** in source code
✅ **Authentication required** for all protected routes
  - Upload API requires authentication (`requireAuth()` on line 19 in `app/api/upload/route.ts`)
  - Children API requires authentication
  - Uploads viewing requires authentication
  - Analysis API does NOT require authentication (server-to-server calls)

### Authentication Status by Endpoint

| Endpoint | Authentication | Reason |
|----------|---------------|---------|
| `/api/upload` | ✅ Required | User-initiated upload |
| `/api/analyze` | ❌ Disabled | Server-to-server internal calls |
| `/api/uploads/[id]` | ✅ Required | Viewing results |
| `/api/children` | ✅ Required | Managing children |
| `/api/children/[id]` | ✅ Required | Child details |
| `/api/auth/*` | ⚪ N/A | Auth endpoints |

## 3. Database Setup

### Before Deployment

1. Ensure PostgreSQL database is created
2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Verify database connection:
   ```bash
   npx prisma db push
   ```

### Database Requirements

- PostgreSQL 12 or higher
- PrismaPg adapter configured in `lib/db.ts`
- Connection pooling enabled for production

## 4. File Storage Setup

### Uploaded Files Directory

- Files are stored in `/tmp` directory
- This directory is created automatically by the upload API
- **Production consideration**: This directory should be:
  - Persistent (not ephemeral storage)
  - Backed up regularly
  - Have sufficient disk space (10MB per file)
  - Have proper file permissions

### Recommended Production Storage

For production, consider migrating to cloud storage:
- AWS S3
- Google Cloud Storage
- Cloudflare R2
- Vercel Blob Storage

The upload logic is in `app/api/upload/route.ts` (lines 142-159).

## 5. Google Cloud Vision Setup

### Steps to Configure

1. Create a Google Cloud project
2. Enable Cloud Vision API
3. Create a service account
4. Download credentials JSON file
5. Upload credentials file to your server
6. Set `GOOGLE_APPLICATION_CREDENTIALS` to the file path

### Current Implementation

- Credentials loaded in `lib/ocr/vision.ts`
- Path must be absolute and accessible by the Node.js process
- File must be readable by the application user

## 6. Build and Deploy Commands

### Build Commands

```bash
# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Build Next.js application
npm run build
```

### Start Command

```bash
npm start
```

### Development Commands

```bash
# Development server
npm run dev

# Database studio
npx prisma studio
```

## 7. Environment-Specific Configuration

### Development (.env.local)

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/gradeai
NEXTAUTH_URL=http://localhost:3000
```

### Production

```bash
DATABASE_URL=postgresql://user:pass@production-db:5432/gradeai
NEXTAUTH_URL=https://yourdomain.com
```

## 8. Post-Deployment Verification

### Test Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Add child profile
- [ ] Upload test image
- [ ] Verify OCR extraction (check logs)
- [ ] Verify AI analysis runs
- [ ] View analysis results
- [ ] Delete test upload
- [ ] Logout works

### Monitoring

Watch logs for:
- `[Upload API]` - Upload processing
- `[Analyze API]` - Analysis execution
- `[OCR]` - Text extraction
- `[Claude AI]` - AI analysis
- `=== TRIGGERING ANALYSIS ===` - Analysis trigger confirmation

## 9. Known Configuration Notes

### Analysis Trigger

- Upload API triggers analysis via internal `fetch()` call (line 180 in `app/api/upload/route.ts`)
- Uses `NEXTAUTH_URL` environment variable as base URL
- Falls back to `http://localhost:3000` if not set
- Analysis runs in background (non-blocking)

### Duplicate Detection

- Upload API checks for duplicate filenames per child (lines 98-140 in `app/api/upload/route.ts`)
- Redirects to existing analysis if already completed
- Allows retry if previous upload failed

### File Size Limits

- Maximum file size: 10MB (configurable in `app/api/upload/route.ts:14`)
- Allowed file types: JPG, PNG, PDF

## 10. Troubleshooting

### Common Issues

**Issue**: "Unauthorized: You must be logged in"
- **Solution**: This should only appear on upload/viewing endpoints, not analyze endpoint
- **Check**: Verify analyze endpoint has authentication disabled (line 44-50 in `app/api/analyze/route.ts`)

**Issue**: Analysis not running
- **Solution**: Check `NEXTAUTH_URL` is set correctly
- **Check**: Look for `=== TRIGGERING ANALYSIS ===` in logs

**Issue**: Google Vision API errors
- **Solution**: Verify credentials file path and permissions
- **Check**: `GOOGLE_APPLICATION_CREDENTIALS` is absolute path

**Issue**: Database connection errors
- **Solution**: Verify `DATABASE_URL` format and credentials
- **Check**: Database accepts connections from your server IP

## 11. Security Best Practices

- ✅ Rotate `NEXTAUTH_SECRET` regularly
- ✅ Use strong database passwords
- ✅ Keep API keys secure and never commit them
- ✅ Enable SSL/TLS for database connections in production
- ✅ Use HTTPS for production deployment
- ✅ Regularly update dependencies: `npm audit` and `npm update`
- ✅ Monitor API usage and costs (Anthropic, Google Cloud)
- ✅ Set up rate limiting for API endpoints
- ✅ Enable CORS only for trusted domains

## 12. Cost Considerations

### Anthropic Claude API

- Model: `claude-3-haiku-20240307`
- ~4096 max tokens per analysis
- Current pricing: Check https://www.anthropic.com/pricing
- Cost optimization: Already using Haiku (most cost-effective)

### Google Cloud Vision API

- Text detection API calls
- First 1,000 units/month free
- Current pricing: Check https://cloud.google.com/vision/pricing
- Cost optimization: Consider caching OCR results

### Database

- Storage grows with uploads (10MB per file in database record + actual file)
- Consider archiving old uploads
- Monitor database size regularly

## 13. Backup Strategy

### What to Backup

1. **Database** - All user data, children, uploads, analysis
2. **Uploaded files** - `/tmp` directory
3. **Environment variables** - Document all production env vars
4. **Google credentials** - Keep secure backup of JSON file

### Backup Frequency

- Database: Daily automated backups
- Files: Weekly or daily depending on usage
- Environment config: After any changes

## 14. Files Modified for Deployment

### Security Files

- `.gitignore` - Added `/tmp`, `google-credentials.json`, `.env*`
- `.env.example` - Template for all required environment variables

### Configuration Files

- `lib/auth.ts` - NextAuth configuration with JWT strategy
- `lib/db.ts` - Prisma client with connection pooling
- `app/api/analyze/route.ts` - Authentication disabled for internal calls (lines 44-50)

### No Hardcoded Values Found In

✅ `app/api/upload/route.ts` - Uses `process.env.NEXTAUTH_URL`
✅ `lib/auth.ts` - Uses `process.env.NEXTAUTH_SECRET`, `process.env.DATABASE_URL`
✅ `lib/ai/claude.ts` - Uses `process.env.ANTHROPIC_API_KEY`
✅ `lib/ocr/vision.ts` - Uses `process.env.GOOGLE_CREDENTIALS_JSON` (written to `/tmp` at runtime)
✅ `lib/db.ts` - Uses `process.env.DATABASE_URL`, `process.env.NODE_ENV`

## 15. Recommended Hosting Platforms

### Next.js Application

- **Vercel** (Recommended) - Zero-config deployment for Next.js
- **Railway** - Supports full-stack apps with persistent storage
- **Render** - Good PostgreSQL integration
- **AWS Amplify** - Enterprise-grade hosting

### Database

- **Railway** - PostgreSQL with automatic backups
- **Supabase** - PostgreSQL with additional features
- **Neon** - Serverless PostgreSQL
- **AWS RDS** - Enterprise-grade PostgreSQL

### File Storage (Recommended for Production)

- **Vercel Blob** - If hosting on Vercel

## Google Credentials on Vercel

For serverless deployments (Vercel) we recommend using a single environment variable:

- `GOOGLE_CREDENTIALS_JSON`: the full service-account JSON as a one-line JSON string (private_key should be PKCS#8 PEM compatible). The app writes this to `/tmp/google-credentials.json` at runtime and sets `GOOGLE_APPLICATION_CREDENTIALS` so Google client libs work.

Why this is preferred:

- Secure: keep the JSON in Vercel's encrypted env dashboard instead of committing files.
- Works reliably on serverless platforms where bundling a file is inconvenient.

Quick steps to set it up:

1. Convert your service account JSON private_key to PKCS#8 one-line JSON using the included script `scripts/convert-key-pkcs8.cjs`.
2. In the Vercel dashboard, set an environment variable `GOOGLE_CREDENTIALS_JSON` with the one-line JSON value.
3. Remove any `GOOGLE_APPLICATION_CREDENTIALS` and `NODE_OPTIONS` entries from the Vercel env (they are not required and `NODE_OPTIONS` can cause build/runtime issues).
4. Redeploy your project.

Notes:

- Local development can still use a file and `GOOGLE_APPLICATION_CREDENTIALS` if you prefer; production on Vercel should use `GOOGLE_CREDENTIALS_JSON`.
- Keep the JSON secret and rotate the service account if it was committed anywhere.
- **AWS S3** - Industry standard
- **Cloudflare R2** - Cost-effective alternative to S3

---

## Ready to Deploy? ✅

Before deploying, ensure:

1. ✅ All environment variables are configured
2. ✅ Database is set up and accessible
3. ✅ Google Cloud credentials are uploaded
4. ✅ `.env.local` is NOT committed to git
5. ✅ Production build completes successfully: `npm run build`
6. ✅ All sensitive files are in `.gitignore`
7. ✅ NEXTAUTH_SECRET is generated and secure
8. ✅ NEXTAUTH_URL points to production domain

**Last Updated**: 2026-01-13
