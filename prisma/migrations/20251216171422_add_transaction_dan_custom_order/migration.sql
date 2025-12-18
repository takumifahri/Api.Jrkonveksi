/*
  Warnings:

  - The values [HABIS] on the enum `StatusMaterial` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `RespondenId` on the `ResponseContact` table. All the data in the column will be lost.
  - You are about to drop the column `contacatId` on the `ResponseContact` table. All the data in the column will be lost.
  - You are about to drop the column `isBlocked` on the `users` table. All the data in the column will be lost.
  - Added the required column `contact_id` to the `ResponseContact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responden_id` to the `ResponseContact` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UkuranBaju" AS ENUM ('EXTRA_SMALL', 'SMALL', 'MEDIUM', 'REGULER', 'LARGE', 'EXTRA_LARGE', 'DOUBLE_EXTRA_LARGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "StatusPemesanan" AS ENUM ('PENDING', 'NEGOSIASI', 'PEMBAYARAN', 'PENGERJAAN', 'DIBATALKAN', 'SELESAI');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('LUNAS', 'BELUM_BAYAR', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('GOPAY', 'OVO', 'SEABANK', 'BCA', 'SHOPEEPAY');

-- AlterEnum
BEGIN;
CREATE TYPE "StatusMaterial_new" AS ENUM ('UNAVAILABLE', 'AVAILABLE', 'PENDING');
ALTER TABLE "Materials" ALTER COLUMN "status" TYPE "StatusMaterial_new" USING ("status"::text::"StatusMaterial_new");
ALTER TYPE "StatusMaterial" RENAME TO "StatusMaterial_old";
ALTER TYPE "StatusMaterial_new" RENAME TO "StatusMaterial";
DROP TYPE "public"."StatusMaterial_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ResponseContact" DROP CONSTRAINT "ResponseContact_RespondenId_fkey";

-- DropForeignKey
ALTER TABLE "ResponseContact" DROP CONSTRAINT "ResponseContact_contacatId_fkey";

-- AlterTable
ALTER TABLE "ResponseContact" DROP COLUMN "RespondenId",
DROP COLUMN "contacatId",
ADD COLUMN     "contact_id" INTEGER NOT NULL,
ADD COLUMN     "responden_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isBlocked",
ADD COLUMN     "is_blocked" BOOLEAN;

-- CreateTable
CREATE TABLE "PemesananKonveksi" (
    "id" SERIAL NOT NULL,
    "unique_id" TEXT NOT NULL,
    "nama_pemesanan" TEXT NOT NULL,
    "total_harga" BIGINT NOT NULL,
    "ukuran" "UkuranBaju" NOT NULL,
    "status" "StatusPemesanan" NOT NULL,
    "jumlah_barang" INTEGER NOT NULL,
    "catatan" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "material_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PemesananKonveksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "unique_id" TEXT NOT NULL,
    "status" "StatusPembayaran" NOT NULL,
    "total_harga" BIGINT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "file_screenshot" TEXT,
    "keterangan" TEXT,
    "custom_order_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PemesananKonveksi_unique_id_key" ON "PemesananKonveksi"("unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_unique_id_key" ON "Transaction"("unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_custom_order_id_key" ON "Transaction"("custom_order_id");

-- AddForeignKey
ALTER TABLE "PemesananKonveksi" ADD CONSTRAINT "PemesananKonveksi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PemesananKonveksi" ADD CONSTRAINT "PemesananKonveksi_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PemesananKonveksi" ADD CONSTRAINT "PemesananKonveksi_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_custom_order_id_fkey" FOREIGN KEY ("custom_order_id") REFERENCES "PemesananKonveksi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseContact" ADD CONSTRAINT "ResponseContact_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "ContactForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseContact" ADD CONSTRAINT "ResponseContact_responden_id_fkey" FOREIGN KEY ("responden_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
