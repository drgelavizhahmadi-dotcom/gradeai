# Database Schema Diagram

## Visual Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GradeAI Database Schema                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       User           │
├──────────────────────┤
│ id (PK)              │──┐
│ email (unique)       │  │
│ name                 │  │
│ phone                │  │
│ language             │  │
│ hashedPassword       │  │
│ subscriptionStatus   │  │
│ emailVerified        │  │
│ image                │  │
│ createdAt            │  │
│ updatedAt            │  │
└──────────────────────┘  │
         │                │
         │ 1:N            │ 1:N
         │                │
         ▼                ▼
┌──────────────────────┐ ┌──────────────────────┐
│       Child          │ │       Upload         │
├──────────────────────┤ ├──────────────────────┤
│ id (PK)              │ │ id (PK)              │
│ name                 │ │ userId (FK) ────────┐│
│ grade                │ │ childId (FK) ───┐   ││
│ schoolType           │ │ fileName         │   ││
│ userId (FK) ─────────┘ │ fileUrl          │   ││
│ createdAt            │ │ fileSize         │   ││
│ updatedAt            │ │ mimeType         │   ││
└──────────────────────┘ │ subject          │   ││
         │               │ grade            │   ││
         │ 1:N           │ teacherComment   │   ││
         └───────────────┼─ extractedText   │   ││
                         │ analysisStatus   │   ││
                         │ analysis (JSON)  │   ││
                         │ errorMessage     │   ││
                         │ uploadedAt       │   ││
                         │ processedAt      │   ││
                         └──────────────────┘   ││
                                 ▲               ││
                                 └───────────────┘│
                                                  │
┌──────────────────────┐                         │
│      Account         │                         │
├──────────────────────┤                         │
│ id (PK)              │                         │
│ userId (FK) ─────────┼─────────────────────────┘
│ type                 │
│ provider             │
│ providerAccountId    │
│ refresh_token        │
│ access_token         │
│ expires_at           │
│ token_type           │
│ scope                │
│ id_token             │
│ session_state        │
└──────────────────────┘

┌──────────────────────┐
│      Session         │
├──────────────────────┤
│ id (PK)              │
│ sessionToken (unique)│
│ userId (FK) ─────────┼──────────────────────────┐
│ expires              │                          │
└──────────────────────┘                          │
                                                  │
┌──────────────────────┐                          │
│ VerificationToken    │                          │
├──────────────────────┤                          │
│ identifier           │                          │
│ token (unique)       │                          │
│ expires              │                          │
└──────────────────────┘                          │
                                                  │
                        ┌─────────────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │       User           │
              │  (Authentication)    │
              └──────────────────────┘
```

---

## Relationships Explained

### User Relationships

```
User (1) ──────────► (N) Child
  │
  ├─────────────────► (N) Upload
  │
  ├─────────────────► (N) Account
  │
  └─────────────────► (N) Session
```

**One user can have:**
- Multiple children (students)
- Multiple uploads (test files)
- Multiple accounts (OAuth providers)
- Multiple sessions (logged in devices)

### Child Relationships

```
User (1) ──────────► (N) Child (1) ──────────► (N) Upload
```

**One child can have:**
- Multiple uploads (different tests)
- Belongs to one user (parent/guardian)

### Upload Relationships

```
User (1) ──────────► (N) Upload
Child (1) ──────────► (N) Upload
```

**One upload:**
- Belongs to one user
- Belongs to one child
- Contains OCR text, analysis, and grade

---

## Data Flow

### User Registration & Login Flow

```
1. User signs up
   └─► User record created
       └─► hashedPassword stored (bcrypt)

2. User logs in
   └─► Credentials verified
       └─► Session created
           └─► JWT token issued
```

### Upload & Analysis Flow

```
1. User uploads test
   └─► File saved to /tmp
       └─► Upload record created (status: pending)
           └─► Triggers analysis API

2. Analysis API processes
   └─► OCR extracts text (Google Vision)
       └─► Parses German test data
           └─► AI analyzes with Claude
               └─► Updates Upload record (status: completed)
                   └─► Stores analysis as JSON
```

### Data Access Flow

```
User logs in
└─► Views dashboard
    └─► Fetches children
        └─► For each child:
            └─► Fetches uploads
                └─► Displays analysis results
```

---

## Field Types & Constraints

### Primary Keys
- All use `cuid()` - Collision-resistant unique identifiers
- Format: `ckxxx...` (25 characters)

### Foreign Keys
- `userId` - References User.id (CASCADE DELETE)
- `childId` - References Child.id (CASCADE DELETE)

### Unique Constraints
- `User.email` - One email per user
- `Account.[provider, providerAccountId]` - One account per provider
- `Session.sessionToken` - Unique session identifier
- `VerificationToken.token` - Unique verification token

### Indexes (Performance Optimization)
```sql
-- Fast email lookups for login
CREATE INDEX idx_user_email ON "User"(email);

-- Fast upload queries
CREATE INDEX idx_upload_user ON "Upload"(userId);
CREATE INDEX idx_upload_child ON "Upload"(childId);
CREATE INDEX idx_upload_status ON "Upload"(analysisStatus);
CREATE INDEX idx_upload_date ON "Upload"(uploadedAt);

-- Fast child lookups
CREATE INDEX idx_child_user ON "Child"(userId);

-- Fast session lookups
CREATE INDEX idx_session_user ON "Session"(userId);
CREATE INDEX idx_account_user ON "Account"(userId);
```

---

## Data Types

### String Fields
- `String` - VARCHAR (variable length)
- `String @db.Text` - TEXT (unlimited length)
  - Used for: teacherComment, extractedText (long content)

### Numeric Fields
- `Int` - Integer (32-bit)
  - Used for: grade (1-13), fileSize (bytes)
- `Float` - Floating point
  - Used for: grade (2.5, 3.0, etc.)

### Date Fields
- `DateTime` - Timestamp with timezone
  - `@default(now())` - Set to current time on creation
  - `@updatedAt` - Automatically updates on modification

### JSON Fields
- `Json` - Structured JSON data
  - Used for: analysis (AI analysis results)
  - Queryable with Prisma JSON filters

### Boolean (Implicit)
- Email verification: `emailVerified DateTime?` (null = not verified)

---

## Cascade Delete Behavior

```
Delete User
├─► Cascade deletes all Child records
├─► Cascade deletes all Upload records
├─► Cascade deletes all Account records
└─► Cascade deletes all Session records

Delete Child
└─► Cascade deletes all Upload records

Delete Upload
└─► No cascades (leaf node)
```

**Important:** Deleting a user removes ALL related data permanently!

---

## Storage Estimates

### Per User
- User record: ~500 bytes
- Average 2 children: ~400 bytes
- Average 10 uploads per child: ~50 KB
- **Total: ~51 KB per active user**

### Per 1,000 Users
- User data: ~500 KB
- Children: ~400 KB
- Upload metadata: ~10 MB
- Analysis JSON: ~20 MB
- **Total: ~30 MB per 1,000 users**

### Production Database Size Estimate
- 10,000 users: ~300 MB
- 100,000 users: ~3 GB

**Note:** This excludes actual files stored in `/tmp` directory.

---

## Query Patterns

### Common Queries

**Get user with children and uploads:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    children: {
      include: {
        uploads: {
          orderBy: { uploadedAt: 'desc' },
          take: 10
        }
      }
    }
  }
})
```

**Get child's latest uploads:**
```typescript
const uploads = await prisma.upload.findMany({
  where: { childId: childId },
  orderBy: { uploadedAt: 'desc' },
  take: 20,
  include: {
    child: true
  }
})
```

**Get uploads pending analysis:**
```typescript
const pending = await prisma.upload.findMany({
  where: { analysisStatus: 'pending' },
  orderBy: { uploadedAt: 'asc' }
})
```

---

## Analysis JSON Structure

The `Upload.analysis` field stores AI analysis as JSON:

```json
{
  "parsedAt": "2025-01-13T10:30:00Z",
  "confidence": "medium",
  "extractedData": {
    "grade": "2.5",
    "gradeNumeric": 2.5,
    "subject": "Mathematik",
    "teacherComment": "Gut gemacht, aber..."
  },
  "ai": {
    "gradeInterpretation": {
      "severity": "good",
      "concernLevel": "low",
      "explanation": "This is a good grade...",
      "germanContext": "In Germany, 2.5 is..."
    },
    "teacherFeedback": {
      "summary": "Positive feedback overall",
      "keyPoints": ["Good effort", "Needs improvement in..."],
      "tone": "encouraging"
    },
    "strengths": [
      { "area": "Problem solving", "description": "..." }
    ],
    "weaknesses": [
      { "area": "Calculation speed", "description": "..." }
    ],
    "recommendations": [
      {
        "priority": "high",
        "action": "Practice times tables",
        "rationale": "..."
      }
    ],
    "resources": {
      "free": [
        {
          "name": "Khan Academy",
          "url": "https://...",
          "description": "..."
        }
      ],
      "paid": [...]
    }
  }
}
```

---

## Schema Version

**Current Version:** 1.0
**Prisma Version:** 7.x
**Database:** PostgreSQL 12+
**Adapter:** PrismaPg (connection pooling)

**Last Updated:** 2026-01-13

---

## Migration History

```
Initial Schema (v1.0)
└─► Created tables: User, Child, Upload, Account, Session, VerificationToken
    └─► Configured indexes for performance
        └─► Set up cascade deletes
            └─► Ready for production
```

No migrations yet - this is the initial schema.

---

## Future Schema Considerations

Potential additions for v2.0:

- **Subscription** table (if adding paid tiers)
- **Notification** table (for alerts)
- **AuditLog** table (for compliance)
- **AnalysisFeedback** table (user ratings)
- **SharedUpload** table (share results with others)

These are NOT implemented yet - just future ideas!
