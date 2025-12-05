-- AlterTable
ALTER TABLE "User" ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "login_attempt" INTEGER DEFAULT 0;
