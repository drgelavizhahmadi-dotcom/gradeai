#!/bin/bash

# GradeAI - Production Database Migration Script
# This script helps you migrate your database to production

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  GradeAI - Production Database Migration                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set!"
    echo ""
    echo "Please set your production database URL:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:5432/database'"
    echo ""
    echo "Examples:"
    echo "  Vercel Postgres: postgresql://default:abc@ep-name.postgres.vercel-storage.com:5432/verceldb"
    echo "  Supabase: postgresql://postgres.xyz:pass@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
    echo ""
    exit 1
fi

print_success "DATABASE_URL is set"
echo ""

# Confirm production migration
echo "═══════════════════════════════════════════════════════════════"
print_warning "WARNING: You are about to migrate to PRODUCTION database!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Database URL: ${DATABASE_URL:0:50}..."
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Migration cancelled."
    exit 0
fi

echo ""
print_info "Starting migration process..."
echo ""

# Step 1: Check Prisma installation
print_info "[1/6] Checking Prisma installation..."
if ! command -v npx &> /dev/null; then
    print_error "npx command not found. Please install Node.js and npm."
    exit 1
fi
print_success "Prisma tools available"
echo ""

# Step 2: Generate Prisma Client
print_info "[2/6] Generating Prisma Client..."
if npx prisma generate; then
    print_success "Prisma Client generated"
else
    print_error "Failed to generate Prisma Client"
    exit 1
fi
echo ""

# Step 3: Check database connection
print_info "[3/6] Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database. Please check your DATABASE_URL."
    exit 1
fi
echo ""

# Step 4: Check migration status
print_info "[4/6] Checking migration status..."
npx prisma migrate status || true
echo ""

# Step 5: Create initial migration if needed
if [ ! -d "prisma/migrations" ]; then
    print_info "[5/6] Creating initial migration..."
    print_warning "This will create a new migration from your schema."
    read -p "Create initial migration? (yes/no): " -r
    echo ""
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        if npx prisma migrate dev --name init; then
            print_success "Initial migration created"
        else
            print_error "Failed to create migration"
            exit 1
        fi
    else
        print_info "Skipping migration creation"
    fi
else
    print_info "[5/6] Migrations directory already exists"
    print_success "Skipping initial migration creation"
fi
echo ""

# Step 6: Deploy migrations
print_info "[6/6] Deploying migrations to production..."
if npx prisma migrate deploy; then
    print_success "Migrations deployed successfully!"
else
    print_error "Migration deployment failed!"
    exit 1
fi
echo ""

# Verify tables
print_info "Verifying database tables..."
echo ""
TABLES=$(npx prisma db execute --stdin <<< "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
" 2>/dev/null || echo "")

if [ -n "$TABLES" ]; then
    print_success "Database tables found:"
    echo "$TABLES" | grep -E 'User|Child|Upload|Account|Session|VerificationToken' || true
else
    print_warning "Could not verify tables (might require different SQL syntax)"
fi
echo ""

# Success message
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✓ MIGRATION COMPLETED SUCCESSFULLY!                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
print_success "Your production database is ready!"
echo ""
print_info "Next steps:"
echo "  1. Deploy your application to production"
echo "  2. Set DATABASE_URL in your hosting environment"
echo "  3. Test user registration and login"
echo "  4. Upload a test file to verify analysis works"
echo "  5. Set up automated backups"
echo ""
print_info "Useful commands:"
echo "  View database: npx prisma studio"
echo "  Check status:  npx prisma migrate status"
echo "  Database pull: npx prisma db pull"
echo ""
