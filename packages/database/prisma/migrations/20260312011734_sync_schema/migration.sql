-- AlterEnum
ALTER TYPE "ListingPaymentStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('WELCOME', 'LISTING_SOLD', 'NEW_MESSAGE', 'PAYMENT_RECEIVED', 'PAYMENT_SENT', 'LISTING_DELETED_BY_ADMIN', 'NEW_LISTING_PUBLISHED', 'LISTING_EXPIRING', 'LISTING_EXPIRED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "offers" DROP CONSTRAINT "offers_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "offers" DROP CONSTRAINT "offers_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "offers" DROP CONSTRAINT "offers_parent_offer_id_fkey";

-- DropForeignKey
ALTER TABLE "offers" DROP CONSTRAINT "offers_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_reviewed_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_reviewer_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_offer_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_seller_id_fkey";

-- AlterTable
ALTER TABLE "listing_payments" DROP COLUMN "payment_token",
ADD COLUMN     "intech_transaction_id" TEXT;

-- AlterTable
ALTER TABLE "listings" ALTER COLUMN "model" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_expires_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" TEXT;

-- DropTable
DROP TABLE "offers";

-- DropTable
DROP TABLE "reviews";

-- DropTable
DROP TABLE "transactions";

-- DropEnum
DROP TYPE "OfferStatus";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentProvider";

-- DropEnum
DROP TYPE "TransactionStatus";

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");
