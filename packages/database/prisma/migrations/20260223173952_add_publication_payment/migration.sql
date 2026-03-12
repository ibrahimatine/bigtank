-- CreateEnum
CREATE TYPE "ListingPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'FREE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ListingStatus" ADD VALUE 'DRAFT';
ALTER TYPE "ListingStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "listing_payments" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "listing_price" INTEGER NOT NULL,
    "status" "ListingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "ref_command" TEXT NOT NULL,
    "payment_token" TEXT,
    "payment_method" TEXT,
    "ipn_payload" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_payments_ref_command_key" ON "listing_payments"("ref_command");

-- CreateIndex
CREATE INDEX "listing_payments_seller_id_idx" ON "listing_payments"("seller_id");

-- CreateIndex
CREATE INDEX "listing_payments_listing_id_idx" ON "listing_payments"("listing_id");

-- CreateIndex
CREATE INDEX "listing_payments_status_idx" ON "listing_payments"("status");

-- AddForeignKey
ALTER TABLE "listing_payments" ADD CONSTRAINT "listing_payments_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_payments" ADD CONSTRAINT "listing_payments_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
