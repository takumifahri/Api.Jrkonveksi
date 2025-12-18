-- AlterTable
ALTER TABLE "PemesananKonveksi" ADD COLUMN     "alasan_ditolak" TEXT,
ADD COLUMN     "material_sendiri" BOOLEAN DEFAULT false,
ADD COLUMN     "waktu_terima" TIMESTAMP(3),
ADD COLUMN     "waktu_tolak" TIMESTAMP(3),
ADD COLUMN     "warna" TEXT,
ALTER COLUMN "total_harga" DROP NOT NULL;
