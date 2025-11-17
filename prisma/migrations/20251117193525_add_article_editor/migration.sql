-- AlterTable
ALTER TABLE "Article" ADD COLUMN "editorId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Article_editorId_idx" ON "Article"("editorId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
