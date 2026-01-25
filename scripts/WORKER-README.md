Worker deployment — analysis-worker
=================================

This repository includes a lightweight polling worker script at `scripts/analysis-worker.ts` that processes uploads with `analysisStatus = 'queued'`.

Options to run persistently in production:

1) Deploy to Google Cloud Run (recommended for serverless container execution)

- Build and push the container (replace `PROJECT_ID` and `REGION`):

```bash
# Build & push to Artifact Registry / Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/gradeai-worker:latest

# Deploy to Cloud Run
gcloud run deploy gradeai-worker \
  --image gcr.io/PROJECT_ID/gradeai-worker:latest \
  --region REGION \
  --platform managed \
  --allow-unauthenticated=false \
  --set-env-vars "DATABASE_URL=...,GOOGLE_CLOUD_STORAGE_BUCKET=...,GOOGLE_CREDENTIALS_JSON=..."
```

Notes:
- Use a Cloud Run service account with permissions for Cloud Storage and the database (or configure IAM accordingly).
- Prefer storing the service-account JSON in Secret Manager and mounting or injecting it as an env var at deploy time (do NOT paste raw JSON into the Cloud Run UI publicly).

2) Run on a VM or container host (systemd)

```bash
# Build locally
docker build -f scripts/worker.Dockerfile -t gradeai-worker:latest .

# Run (example)
docker run -e DATABASE_URL="..." -e GOOGLE_CLOUD_STORAGE_BUCKET="..." -e GOOGLE_CREDENTIALS_JSON="<base64-or-json>" gradeai-worker:latest
```

3) Tips
- The worker requires `DATABASE_URL` (Prisma), `GOOGLE_CLOUD_STORAGE_BUCKET`, and Google credentials (via `GOOGLE_CREDENTIALS_JSON` or `GOOGLE_CREDENTIALS_B64`) to be set in the environment.
- Use Secret Manager / environment injection in Cloud Run to avoid committing secrets.
- For reliability, run one worker instance for low concurrency or multiple scaled instances if you need parallel processing. Use database row locking or `findFirst`+status transitions (the worker uses a simple `queued -> processing` update).
