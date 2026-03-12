-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EMAIL_VERIFICATION';
ALTER TYPE "NotificationType" ADD VALUE 'PASSWORD_RESET';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_verification_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verification_token_key" ON "users"("email_verification_token");
