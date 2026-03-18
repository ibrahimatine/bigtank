-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_listing_id_fkey";

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "listing_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "conversations_is_system_idx" ON "conversations"("is_system");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
