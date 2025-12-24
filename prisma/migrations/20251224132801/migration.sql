/*
  Warnings:

  - You are about to drop the column `harga_minimun` on the `ModelBaju` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ModelBaju" DROP COLUMN "harga_minimun",
ADD COLUMN     "harga_minimum" BIGINT DEFAULT 0;
