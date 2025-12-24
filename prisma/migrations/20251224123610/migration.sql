/*
  Warnings:

  - You are about to drop the column `rentang_harga` on the `ModelBaju` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ModelBaju" DROP COLUMN "rentang_harga",
ADD COLUMN     "harga_maximum" BIGINT DEFAULT 0,
ADD COLUMN     "harga_minimun" BIGINT DEFAULT 0;
