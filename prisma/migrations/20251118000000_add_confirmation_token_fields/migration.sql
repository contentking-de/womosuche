-- AlterTable
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "confirmationToken" TEXT;

-- AlterTable
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "confirmationTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_confirmationToken_key" ON "NewsletterSubscriber"("confirmationToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_confirmationToken_idx" ON "NewsletterSubscriber"("confirmationToken");

