-- AlterEnum
ALTER TYPE "StatusPembayaran" ADD VALUE 'DITOLAK';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "alasan_ditolak" TEXT;
