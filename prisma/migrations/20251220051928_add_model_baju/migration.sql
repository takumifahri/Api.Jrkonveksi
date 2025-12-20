-- AlterTable
ALTER TABLE "PemesananKonveksi" ADD COLUMN     "file_referensi_custom" TEXT,
ADD COLUMN     "model_baju_id" INTEGER,
ADD COLUMN     "referensi_custom" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "ModelBaju" (
    "id" SERIAL NOT NULL,
    "unique_id" TEXT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT,
    "material" TEXT NOT NULL,
    "rentang_harga" BIGINT DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ModelBaju_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelBaju_unique_id_key" ON "ModelBaju"("unique_id");

-- AddForeignKey
ALTER TABLE "PemesananKonveksi" ADD CONSTRAINT "PemesananKonveksi_model_baju_id_fkey" FOREIGN KEY ("model_baju_id") REFERENCES "ModelBaju"("id") ON DELETE SET NULL ON UPDATE CASCADE;
