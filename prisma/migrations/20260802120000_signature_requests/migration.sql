-- CreateEnum
CREATE TYPE "SignatureRequestStatus" AS ENUM ('PENDING', 'SIGNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "signature_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "token" TEXT NOT NULL,
    "status" "SignatureRequestStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "signedFile" TEXT,
    "pageIndex" INTEGER NOT NULL,
    "xRatio" DOUBLE PRECISION NOT NULL,
    "yRatio" DOUBLE PRECISION NOT NULL,
    "wRatio" DOUBLE PRECISION NOT NULL,
    "hRatio" DOUBLE PRECISION NOT NULL,
    "pageWidthPt" DOUBLE PRECISION NOT NULL,
    "pageHeightPt" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "signature_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signature_requests_token_key" ON "signature_requests"("token");

-- CreateIndex
CREATE INDEX "signature_requests_userId_idx" ON "signature_requests"("userId");

-- CreateIndex
CREATE INDEX "signature_requests_anonymousId_idx" ON "signature_requests"("anonymousId");

-- AddForeignKey
ALTER TABLE "signature_requests" ADD CONSTRAINT "signature_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
