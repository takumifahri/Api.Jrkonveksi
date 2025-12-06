-- AlterTable
ALTER TABLE "User" ADD COLUMN     "otp_expired_in" TIMESTAMP(3),
ADD COLUMN     "otp_token" TEXT;
