# GradeAI - Production Database Migration Script (PowerShell)
# This script helps you migrate your database to production

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  GradeAI - Production Database Migration                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Print-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Print-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Print-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Print-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Blue }

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Print-Error "DATABASE_URL environment variable is not set!"
    Write-Host ""
    Write-Host "Please set your production database URL:" -ForegroundColor White
    Write-Host '  $env:DATABASE_URL="postgresql://user:pass@host:5432/database"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  Vercel Postgres: postgresql://default:abc@ep-name.postgres.vercel-storage.com:5432/verceldb" -ForegroundColor Gray
    Write-Host "  Supabase: postgresql://postgres.xyz:pass@aws-0-us-west-1.pooler.supabase.com:5432/postgres" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Print-Success "DATABASE_URL is set"
Write-Host ""

# Confirm production migration
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Print-Warning "WARNING: You are about to migrate to PRODUCTION database!"
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "Database URL: $($env:DATABASE_URL.Substring(0, [Math]::Min(50, $env:DATABASE_URL.Length)))..." -ForegroundColor White
Write-Host ""
$confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Print-Info "Migration cancelled."
    exit 0
}

Write-Host ""
Print-Info "Starting migration process..."
Write-Host ""

# Step 1: Check Prisma installation
Print-Info "[1/6] Checking Prisma installation..."
try {
    $null = Get-Command npx -ErrorAction Stop
    Print-Success "Prisma tools available"
} catch {
    Print-Error "npx command not found. Please install Node.js and npm."
    exit 1
}
Write-Host ""

# Step 2: Generate Prisma Client
Print-Info "[2/6] Generating Prisma Client..."
try {
    npx prisma generate
    if ($LASTEXITCODE -ne 0) { throw "Generation failed" }
    Print-Success "Prisma Client generated"
} catch {
    Print-Error "Failed to generate Prisma Client"
    exit 1
}
Write-Host ""

# Step 3: Check database connection
Print-Info "[3/6] Testing database connection..."
try {
    $testQuery = "SELECT 1;"
    $testQuery | npx prisma db execute --stdin 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Database connection successful"
    } else {
        throw "Connection failed"
    }
} catch {
    Print-Error "Cannot connect to database. Please check your DATABASE_URL."
    exit 1
}
Write-Host ""

# Step 4: Check migration status
Print-Info "[4/6] Checking migration status..."
npx prisma migrate status
Write-Host ""

# Step 5: Create initial migration if needed
if (-not (Test-Path "prisma/migrations")) {
    Print-Info "[5/6] Creating initial migration..."
    Print-Warning "This will create a new migration from your schema."
    $createMigration = Read-Host "Create initial migration? (yes/no)"
    Write-Host ""
    if ($createMigration -eq "yes") {
        try {
            npx prisma migrate dev --name init
            if ($LASTEXITCODE -ne 0) { throw "Migration creation failed" }
            Print-Success "Initial migration created"
        } catch {
            Print-Error "Failed to create migration"
            exit 1
        }
    } else {
        Print-Info "Skipping migration creation"
    }
} else {
    Print-Info "[5/6] Migrations directory already exists"
    Print-Success "Skipping initial migration creation"
}
Write-Host ""

# Step 6: Deploy migrations
Print-Info "[6/6] Deploying migrations to production..."
try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -ne 0) { throw "Deployment failed" }
    Print-Success "Migrations deployed successfully!"
} catch {
    Print-Error "Migration deployment failed!"
    exit 1
}
Write-Host ""

# Verify tables
Print-Info "Verifying database tables..."
Write-Host ""
$verifyQuery = @"
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"@

try {
    $tables = $verifyQuery | npx prisma db execute --stdin 2>&1
    if ($tables -match "User|Child|Upload|Account|Session|VerificationToken") {
        Print-Success "Database tables found:"
        Write-Host $tables -ForegroundColor Gray
    }
} catch {
    Print-Warning "Could not verify tables (might require different SQL syntax)"
}
Write-Host ""

# Success message
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✓ MIGRATION COMPLETED SUCCESSFULLY!                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Print-Success "Your production database is ready!"
Write-Host ""
Print-Info "Next steps:"
Write-Host "  1. Deploy your application to production" -ForegroundColor White
Write-Host "  2. Set DATABASE_URL in your hosting environment" -ForegroundColor White
Write-Host "  3. Test user registration and login" -ForegroundColor White
Write-Host "  4. Upload a test file to verify analysis works" -ForegroundColor White
Write-Host "  5. Set up automated backups" -ForegroundColor White
Write-Host ""
Print-Info "Useful commands:"
Write-Host "  View database: npx prisma studio" -ForegroundColor White
Write-Host "  Check status:  npx prisma migrate status" -ForegroundColor White
Write-Host "  Database pull: npx prisma db pull" -ForegroundColor White
Write-Host ""
