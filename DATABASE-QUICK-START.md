# Database Migration - Quick Start Guide

Choose your hosting provider and follow the steps below.

---

## 🚀 Option 1: Vercel Postgres (5 Minutes)

**Best for**: Applications deploying to Vercel

### Step 1: Create Database (2 min)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Create Postgres database
vercel postgres create gradeai-production
```

Or via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Storage → Create Database → Postgres
4. Name: `gradeai-production`

### Step 2: Get Connection String (1 min)

In Vercel Dashboard → Storage → Your Database → .env.local tab, copy `POSTGRES_URL`

### Step 3: Deploy Migration (2 min)

```bash
# Set environment variable
export DATABASE_URL="your-postgres-url-here"

# Run migration script (Unix/Mac)
chmod +x scripts/migrate-to-production.sh
./scripts/migrate-to-production.sh

# Or Windows PowerShell
.\scripts\migrate-to-production.ps1
```

### Step 4: Configure Vercel

In Vercel Dashboard → Project → Settings → Environment Variables:
- Add `DATABASE_URL` = your POSTGRES_URL
- Environments: Production, Preview

**Done!** ✅ Deploy your app and it will use the production database.

---

## 🐘 Option 2: Supabase (7 Minutes)

**Best for**: Any hosting platform + generous free tier

### Step 1: Create Project (3 min)

1. Go to https://supabase.com
2. Sign up / Log in
3. New Project
4. Name: `gradeai-production`
5. Database Password: Generate strong password (SAVE IT!)
6. Region: Choose closest to users
7. Create project (wait 2-3 min)

### Step 2: Get Connection String (2 min)

1. Project Settings (gear icon) → Database
2. Connection string → **Pooler** tab
3. Copy **Transaction Mode** URL:
   ```
   postgresql://postgres.xyz:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Deploy Migration (2 min)

```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres.xyz:yourpassword@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true"

# Run migration script (Unix/Mac)
chmod +x scripts/migrate-to-production.sh
./scripts/migrate-to-production.sh

# Or Windows PowerShell
.\scripts\migrate-to-production.ps1
```

### Step 4: Disable RLS (Optional)

In Supabase Dashboard → Table Editor:
- For each table → ••• → Edit Table
- Uncheck "Enable Row Level Security"
- (Or create policies to allow service role access)

**Done!** ✅ Set `DATABASE_URL` in your hosting platform and deploy.

---

## ⚡ Manual Migration (If Scripts Don't Work)

### Generate Prisma Client
```bash
npx prisma generate
```

### Create Initial Migration
```bash
# Create migration from current schema
npx prisma migrate dev --name init
```

### Deploy to Production
```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-url"

# Deploy all migrations
npx prisma migrate deploy
```

### Verify
```bash
# Check migration status
npx prisma migrate status

# Open database browser
npx prisma studio
```

---

## ✅ Verification Checklist

After migration, verify everything works:

### 1. Check Tables Created
```bash
npx prisma studio
```

Expected tables:
- ✅ User
- ✅ Child
- ✅ Upload
- ✅ Account
- ✅ Session
- ✅ VerificationToken

### 2. Test Application

1. **Register new user**
   - Go to `/auth/signin`
   - Click "Sign up"
   - Create account

2. **Create child profile**
   - Go to `/children`
   - Add child with name, grade, school type

3. **Upload test**
   - Go to child detail page
   - Upload a test image
   - Wait for analysis

4. **Verify analysis**
   - Check that OCR extracts text
   - Check that AI analysis appears
   - Verify grade and comments display

### 3. Check Database Logs

**Vercel Postgres:**
- Dashboard → Storage → Logs

**Supabase:**
- Dashboard → Database → Logs

Look for:
- ✅ No connection errors
- ✅ Queries executing successfully
- ✅ No permission errors

---

## 🔧 Troubleshooting

### "Cannot connect to database"

**Check:**
1. Is `DATABASE_URL` set correctly?
   ```bash
   echo $DATABASE_URL
   ```
2. Does URL include password?
3. Is database running? (Check provider dashboard)
4. For Supabase: Using **Pooler** connection string?

**Fix:**
```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

### "Migration failed"

**Check:**
```bash
npx prisma migrate status
```

**Reset (DEV ONLY):**
```bash
npx prisma migrate reset  # WARNING: Deletes all data!
```

**Manual deployment:**
```bash
npx prisma migrate deploy
```

### "Prisma Client not generated"

**Fix:**
```bash
npx prisma generate
```

Add to build script in `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### "SSL connection required"

**Fix:** Add to connection string:
```
?sslmode=require
```

Full example:
```
postgresql://user:pass@host:5432/db?sslmode=require
```

### "Too many connections"

**Vercel Postgres:** Upgrade plan or reduce connection pool size

**Supabase:** Use **Pooler** connection string (not direct)

**Fix connection pool** in `lib/db.ts`:
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,  // Reduce this number
});
```

---

## 📊 What Gets Migrated?

### Tables
- ✅ User (accounts, authentication)
- ✅ Child (student profiles)
- ✅ Upload (test files and analysis)
- ✅ Account (OAuth providers)
- ✅ Session (user sessions)
- ✅ VerificationToken (email verification)

### Indexes
- ✅ User.email (fast lookups)
- ✅ Upload.userId (user's uploads)
- ✅ Upload.childId (child's uploads)
- ✅ Upload.analysisStatus (filtering)
- ✅ Upload.uploadedAt (sorting)

### Relationships
- ✅ User → Children (one-to-many)
- ✅ User → Uploads (one-to-many)
- ✅ Child → Uploads (one-to-many)
- ✅ Cascade deletes configured

### What Does NOT Get Migrated?
- ❌ Uploaded files (`/tmp` directory)
- ❌ Environment variables
- ❌ API keys
- ❌ Google credentials

**Note:** You must configure these separately in production!

---

## 💰 Cost Estimates

### Vercel Postgres

| Plan | Storage | Compute | Price | Good For |
|------|---------|---------|-------|----------|
| Hobby | 256 MB | 60 hrs/mo | **FREE** | Testing, small apps |
| Pro | 512 MB | 100 hrs/mo | $20/mo | Production apps |

**Estimated for 1,000 users:** FREE (hobby tier)

### Supabase

| Plan | Storage | API Requests | Price | Good For |
|------|---------|--------------|-------|----------|
| Free | 500 MB | Unlimited | **FREE** | Dev, small apps |
| Pro | 8 GB | Unlimited | $25/mo | Production |

**Estimated for 1,000 users:** FREE (free tier)

---

## 🔐 Security Reminders

Before going live:

- [ ] Generate new `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Use strong database password (20+ characters)
- [ ] Enable SSL/TLS for database connections
- [ ] Use HTTPS for production (set `NEXTAUTH_URL=https://...`)
- [ ] Never commit `.env.local` or credentials to git
- [ ] Set up automated backups
- [ ] Monitor database logs for suspicious activity
- [ ] Rotate API keys and passwords regularly

---

## 📞 Need Help?

### Documentation
- **Detailed Guide:** See [DATABASE-MIGRATION.md](DATABASE-MIGRATION.md)
- **Environment Setup:** See [ENVIRONMENT-VARIABLES.md](ENVIRONMENT-VARIABLES.md)
- **Deployment:** See [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)

### Support
- **Prisma:** https://www.prisma.io/docs
- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs

### Common Issues
See "Troubleshooting" section in [DATABASE-MIGRATION.md](DATABASE-MIGRATION.md)

---

## ⏱️ Estimated Time

- **Vercel Postgres:** 5 minutes
- **Supabase:** 7 minutes
- **Manual Migration:** 10 minutes

**Total time to production:** ~15-20 minutes including testing

---

**Ready to migrate?** Choose Option 1 (Vercel) or Option 2 (Supabase) above and start! 🚀
