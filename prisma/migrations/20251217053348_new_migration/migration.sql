-- AlterEnum
ALTER TYPE "StatusPemesanan" ADD VALUE 'DITOLAK';

-- AlterTable
ALTER TABLE "PemesananKonveksi" ALTER COLUMN "catatan" DROP NOT NULL;
