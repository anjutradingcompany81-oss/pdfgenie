-- AlterEnum
ALTER TYPE "MailMergeJobStatus" ADD VALUE 'PAUSED';
ALTER TYPE "MailMergeJobStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
ALTER TYPE "MailMergeRecipientStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "mail_merge_recipients" ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "durationMs" INTEGER;
