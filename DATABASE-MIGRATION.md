# Database Migration Guide for Production

## Overview

This guide provides step-by-step instructions for migrating your GradeAI database to production. Your application uses PostgreSQL with Prisma 7 and the PrismaPg adapter.

## Current Database Schema

### Models Overview

Your database consists of 5 main models:

1. **User** - Parent/guardian accounts
2. **Child** - Student profiles (linked to users)
3. **Upload** - Test file uploads with analysis results
4. **Account** - OAuth provider accounts (NextAuth)
5. **Session** - User sessions (NextAuth)
6. **VerificationToken** - Email verification tokens (NextAuth)

### Schema Details

```prisma
User
├── id (String, cuid)
├── email (String, unique)
├── name (String)
├── phone (String, optional)
├── language (String, default: "de")
├── hashedPassword (String, optional)
├── subscriptionStatus (String, default: "free")
├── emailVerified (DateTime, optional)
├── image (String, optional)
├── createdAt (DateTime)
├── updatedAt (DateTime)
└── Relations: children[], uploads[], accounts[], sessions[]

Child
├── id (String, cuid)
├── name (String)
├── grade (Int, 1-13)
├── schoolType (String)
├── userId (String, foreign key)
├── createdAt (DateTime)
├── updatedAt (DateTime)
└── Relations: user, uploads[]

Upload
├── id (String, cuid)
├── userId (String, foreign key)
├── childId (String, foreign key)
├── fileName (String)
├── fileUrl (String)
├── fileSize (Int)
├── mimeType (String)
├── subject (String, optional)
├── grade (Float, optional)
├── teacherComment (Text, optional)
├── extractedText (Text, optional)
├── analysisStatus (String, default: "pending")
├── analysis (Json, optional)
├── errorMessage (String, optional)
├── uploadedAt (DateTime)
├── processedAt (DateTime, optional)
└── Relations: user, child
```

### Indexes

Performance indexes are configured on:
- `User.email` - Fast login lookups
- `Upload.userId` - User's uploads
- `Upload.childId` - Child's uploads
- `Upload.analysisStatus` - Status filtering
- `Upload.uploadedAt` - Date sorting
- `Account.userId` - Account lookups
- `Session.userId` - Session lookups
- `Child.userId` - User's children

### Storage Requirements

Estimated storage per 1,000 users:
- User data: ~500 KB
- Child profiles: ~200 KB
- Upload metadata: ~5-10 MB (without files)
- Analysis JSON: ~10-20 MB
- **Total database**: ~15-30 MB per 1,000 users

**Note**: Actual test files (images/PDFs) are stored in `/tmp` directory, not in the database.

---

## Migration Option 1: Vercel Postgres (Recommended)

### Why Vercel Postgres?

✅ **Best for Vercel deployments**
✅ **Serverless architecture** - Pay per use
✅ **Automatic scaling**
✅ **Built-in connection pooling**
✅ **Free tier available** (256 MB storage)

### Prerequisites

- Vercel account
- Vercel CLI installed: `npm i -g vercel`
- Your application deployed or ready to deploy on Vercel

### Step 1: Create Vercel Postgres Database

1. **Via Vercel Dashboard:**
   ```
   1. Go to https://vercel.com/dashboard
   2. Select your project (or create new)
   3. Go to "Storage" tab
   4. Click "Create Database"
   5. Select "Postgres"
   6. Choose region (closest to your users)
   7. Name your database: "gradeai-production"
   8. Click "Create"
   ```

2. **Via CLI (Alternative):**
   ```bash
   vercel postgres create gradeai-production
   ```

### Step 2: Get Connection String

1. In Vercel Dashboard → Storage → Your Database
2. Go to ".env.local" tab
3. Copy the `POSTGRES_URL` value
4. It will look like:
   ```
   postgresql://default:abc123@ep-cool-name-123456.us-east-1.postgres.vercel-storage.com:5432/verceldb
   ```

### Step 3: Link Database to Your Project

**Via Vercel Dashboard:**
1. Go to Project → Settings → Environment Variables
2. Add variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your `POSTGRES_URL` (from step 2)
   - **Environments**: Production, Preview, Development

**Via CLI:**
```bash
vercel env add DATABASE_URL
# Paste your POSTGRES_URL when prompted
# Select: Production, Preview
```

### Step 4: Update Local Environment (Optional)

If you want to test against production database locally:

```bash
# Add to .env.local
DATABASE_URL="postgresql://default:abc123@ep-cool-name-123456.us-east-1.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
```

⚠️ **Warning**: Use a separate development database for local testing!

### Step 5: Run Initial Migration

**Option A: Via Vercel Dashboard (Easiest)**

1. Deploy your application to Vercel
2. Vercel will automatically detect Prisma
3. It will run `prisma generate` and `prisma migrate deploy` during build

**Option B: Manual Migration**

```bash
# Set production database URL
export DATABASE_URL="your-production-url"

# Generate Prisma Client
npx prisma generate

# Create initial migration (if not exists)
npx prisma migrate dev --name init

# Deploy to production database
npx prisma migrate deploy
```

### Step 6: Verify Database

```bash
# Check tables were created
npx prisma studio
# Or
npx prisma db pull
```

### Step 7: Seed Initial Data (Optional)

If you need to create an initial admin user:

```bash
npx prisma db seed
```

### Vercel Postgres Configuration

**Build Command** (add to `package.json`):
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**Vercel Build Settings:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Vercel Postgres Pricing

- **Hobby Plan**: FREE
  - 256 MB storage
  - 60 hours compute/month
  - Good for: Testing, small apps

- **Pro Plan**: $20/month
  - 512 MB storage
  - 100 hours compute/month
  - Connection pooling
  - Good for: Production apps

**Estimated cost for 1,000 users**: FREE (within hobby limits)

---

## Migration Option 2: Supabase (Alternative)

### Why Supabase?

✅ **Generous free tier** (500 MB storage, unlimited API requests)
✅ **Built-in authentication** (optional, you're using NextAuth)
✅ **Real-time subscriptions** (optional feature)
✅ **Database backups** included
✅ **Works with any hosting** (not just Vercel)

### Prerequisites

- Supabase account
- Node.js installed

### Step 1: Create Supabase Project

1. **Sign up at https://supabase.com**

2. **Create new project:**
   ```
   1. Click "New Project"
   2. Organization: Create or select
   3. Name: "gradeai-production"
   4. Database Password: Generate strong password (save it!)
   5. Region: Choose closest to your users
   6. Pricing Plan: Free (or Pro if needed)
   7. Click "Create new project"
   ```

3. **Wait 2-3 minutes** for project provisioning

### Step 2: Get Connection String

1. Go to Project Settings (gear icon) → Database
2. Under "Connection string" section, select **"Pooler"** (recommended)
3. Copy the **Transaction Mode** connection string:
   ```
   postgresql://postgres.xyz:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```

4. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Configure Connection Pooling

Supabase provides connection pooling by default. Use the **pooler** connection string (port 5432, not 6543).

**For Prisma with PrismaPg adapter**, use this format:
```
postgresql://postgres.xyz:your-password@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

### Step 4: Add to Environment Variables

**Local (.env.local):**
```bash
DATABASE_URL="postgresql://postgres.xyz:your-password@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Production (Vercel/Railway/etc):**
Add `DATABASE_URL` environment variable with the same value.

### Step 5: Update Prisma Schema (Optional)

Your current schema is already compatible with Supabase. No changes needed.

### Step 6: Run Initial Migration

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy
```

### Step 7: Verify Database

**Via Prisma Studio:**
```bash
npx prisma studio
```

**Via Supabase Dashboard:**
1. Go to Table Editor
2. You should see: User, Child, Upload, Account, Session, VerificationToken tables

### Step 8: Enable Row Level Security (Optional)

Supabase has built-in RLS (Row Level Security). Since you're using NextAuth for authentication, you can skip this or configure it for additional security.

**To disable RLS warnings:**
1. Go to Table Editor
2. For each table → ••• menu → Edit Table
3. Uncheck "Enable Row Level Security"

**To keep RLS enabled:**
Create policies that allow your server to access data:

```sql
-- Allow service role (your server) to access all tables
CREATE POLICY "Enable all access for service role" ON "User"
  FOR ALL USING (true);

-- Repeat for each table: Child, Upload, Account, Session, VerificationToken
```

### Supabase Configuration Tips

**Connection Pooling Settings:**
```typescript
// lib/db.ts - Already configured correctly
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Build Configuration:**
Same as Vercel - ensure `prisma generate` runs during build.

### Supabase Pricing

- **Free Plan**: $0/month
  - 500 MB database space
  - Unlimited API requests
  - 2 GB file storage
  - Good for: Development, small apps

- **Pro Plan**: $25/month
  - 8 GB database space
  - Unlimited API requests
  - 100 GB file storage
  - Daily backups
  - Good for: Production apps

**Estimated cost for 1,000 users**: FREE (within free tier limits)

---

## Migration Checklist

### Pre-Migration

- [ ] Current database schema documented
- [ ] Backup existing data (if migrating from existing DB)
- [ ] Environment variables prepared
- [ ] Database provider account created
- [ ] Strong database password generated

### During Migration

- [ ] Database instance created
- [ ] Connection string obtained
- [ ] Environment variables configured
- [ ] Connection pooling configured
- [ ] `prisma generate` completed successfully
- [ ] `prisma migrate deploy` completed successfully
- [ ] All tables created correctly

### Post-Migration

- [ ] Verify tables exist (User, Child, Upload, Account, Session, VerificationToken)
- [ ] Verify indexes created
- [ ] Test database connection from application
- [ ] Create test user account
- [ ] Upload test file
- [ ] Verify analysis runs
- [ ] Check database logs for errors
- [ ] Set up automated backups
- [ ] Monitor database performance

---

## Backup and Recovery

### Automated Backups

**Vercel Postgres:**
- Daily backups included in paid plans
- Configure in Vercel Dashboard → Storage → Backups

**Supabase:**
- Daily backups included in Free plan
- Access via Dashboard → Database → Backups

### Manual Backup

```bash
# Backup database to SQL file
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20250113.sql
```

### Backup Important Tables Only

```bash
# Backup users and children only
pg_dump $DATABASE_URL -t "User" -t "Child" > essential-backup.sql
```

---

## Troubleshooting

### Error: "Can't reach database server"

**Solution:**
1. Check DATABASE_URL format
2. Verify database is running
3. Check firewall/security group rules
4. Ensure IP is whitelisted (if required)

### Error: "SSL connection required"

**Solution:**
Add `?sslmode=require` to connection string:
```
postgresql://user:pass@host:5432/db?sslmode=require
```

### Error: "Too many connections"

**Solution:**
1. Reduce connection pool size in `lib/db.ts`
2. Use connection pooler (PgBouncer)
3. Upgrade database plan

### Error: "Migration failed"

**Solution:**
1. Check existing migrations: `npx prisma migrate status`
2. Reset database (DEV ONLY): `npx prisma migrate reset`
3. Deploy specific migration: `npx prisma migrate deploy`
4. Check Prisma logs for details

### Error: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```

Add to build command: `prisma generate && next build`

---

## Performance Optimization

### Connection Pooling

Already configured in `lib/db.ts` with PrismaPg adapter:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Adjust based on your plan
});
```

**Recommended pool sizes:**
- Development: 5-10
- Production (small): 10-20
- Production (medium): 20-50
- Production (large): 50-100

### Query Optimization

Your schema already has optimal indexes:
- ✅ User lookups by email
- ✅ Uploads filtered by user, child, status
- ✅ Date-based sorting on uploadedAt

### Monitoring Queries

Enable Prisma query logging in development:

```typescript
// lib/db.ts
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});
```

---

## Migration Scripts

### Create Initial Migration

```bash
# Create migration from schema
npx prisma migrate dev --name init

# This creates: prisma/migrations/XXXXXX_init/migration.sql
```

### Deploy Migration to Production

```bash
# Set production database URL
export DATABASE_URL="your-production-url"

# Deploy all pending migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

### Reset Database (DEV ONLY)

```bash
# WARNING: Deletes all data!
npx prisma migrate reset

# Confirms and recreates database from scratch
```

---

## Next Steps After Migration

1. **Test Application End-to-End**
   - Register new user
   - Create child profile
   - Upload test
   - Verify analysis runs
   - Check results display

2. **Monitor Database**
   - Check connection pool usage
   - Monitor query performance
   - Watch storage growth
   - Set up alerts

3. **Set Up Automated Backups**
   - Daily database dumps
   - Store offsite (S3, Google Cloud Storage)
   - Test restore process

4. **Document Database Credentials**
   - Store DATABASE_URL securely
   - Share with team using secret manager
   - Rotate passwords periodically

5. **Plan for Scale**
   - Monitor user growth
   - Plan database upgrade path
   - Consider read replicas for heavy usage
   - Implement caching strategy

---

## Database Provider Comparison

| Feature | Vercel Postgres | Supabase |
|---------|----------------|----------|
| **Free Tier Storage** | 256 MB | 500 MB |
| **Free Tier Compute** | 60 hrs/month | Unlimited |
| **Connection Pooling** | Built-in | PgBouncer |
| **Backups** | Paid plans only | Daily (all plans) |
| **Best For** | Vercel deployments | Any hosting |
| **Pricing (Pro)** | $20/month | $25/month |
| **Setup Complexity** | Very Easy | Easy |
| **Additional Features** | None | Auth, Storage, Real-time |

**Recommendation:**
- **Use Vercel Postgres** if deploying to Vercel (easiest integration)
- **Use Supabase** if hosting elsewhere or want generous free tier

---

## Support Resources

### Prisma
- Docs: https://www.prisma.io/docs
- Migrate: https://www.prisma.io/docs/concepts/components/prisma-migrate

### Vercel Postgres
- Docs: https://vercel.com/docs/storage/vercel-postgres
- Support: support@vercel.com

### Supabase
- Docs: https://supabase.com/docs/guides/database
- Community: https://github.com/supabase/supabase/discussions

**Last Updated**: 2026-01-13
