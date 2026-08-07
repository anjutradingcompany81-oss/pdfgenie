-- CreateEnum
CREATE TYPE "PdfConversionTargetFormat" AS ENUM ('WORD', 'EXCEL');

-- CreateEnum
CREATE TYPE "PdfConversionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "pdf_conversion_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "targetFormat" "PdfConversionTargetFormat" NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "PdfConversionStatus" NOT NULL DEFAULT 'PENDING',
    "pageCount" INTEGER,
    "fileSizeBytes" INTEGER,
    "processingTimeMs" INTEGER,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_conversion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pdf_conversion_jobs_userId_idx" ON "pdf_conversion_jobs"("userId");

-- CreateIndex
CREATE INDEX "pdf_conversion_jobs_anonymousId_idx" ON "pdf_conversion_jobs"("anonymousId");

-- CreateIndex
CREATE INDEX "pdf_conversion_jobs_createdAt_idx" ON "pdf_conversion_jobs"("createdAt");

-- AddForeignKey
ALTER TABLE "pdf_conversion_jobs" ADD CONSTRAINT "pdf_conversion_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
