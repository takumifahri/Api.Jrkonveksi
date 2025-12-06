/*
  Warnings:

  - You are about to drop the column `otp_expired_in` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `otp_token` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "otp_expired_in",
DROP COLUMN "otp_token";

-- CreateTable
CREATE TABLE "OTP_Verification" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OTP_Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OTP_Verification_email_idx" ON "OTP_Verification"("email");
