-- Migration: add_report_translations
-- Adds a table to cache translated reports per upload × language

CREATE TABLE "ReportTranslation" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportTranslation_pkey" PRIMARY KEY ("id")
);

-- One translation per upload × language
CREATE UNIQUE INDEX "ReportTranslation_uploadId_language_key" ON "ReportTranslation"("uploadId", "language");

-- Fast lookup by uploadId
CREATE INDEX "ReportTranslation_uploadId_idx" ON "ReportTranslation"("uploadId");

-- Foreign key: cascade delete when upload is deleted
ALTER TABLE "ReportTranslation" ADD CONSTRAINT "ReportTranslation_uploadId_fkey"
    FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
