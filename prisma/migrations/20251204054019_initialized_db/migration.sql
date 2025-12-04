-- CreateEnum
CREATE TYPE "StatusMaterial" AS ENUM ('HABIS', 'AVAILABLE');

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL,
    "unique_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR(255) NOT NULL,
    "phone" INTEGER,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "Materials" (
    "id" INTEGER NOT NULL,
    "unique_id" TEXT NOT NULL,
    "status" "StatusMaterial" NOT NULL,
    "description" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "ContactForm" (
    "id" INTEGER NOT NULL,
    "unique_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "Message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "ResponseContact" (
    "id" INTEGER NOT NULL,
    "unique_id" TEXT NOT NULL,
    "contacatId" INTEGER NOT NULL,
    "RespondenId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "Message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3)
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_unique_id_key" ON "User"("unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_id_key" ON "Role"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Materials_id_key" ON "Materials"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Materials_unique_id_key" ON "Materials"("unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContactForm_id_key" ON "ContactForm"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ContactForm_unique_id_key" ON "ContactForm"("unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseContact_id_key" ON "ResponseContact"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseContact_unique_id_key" ON "ResponseContact"("unique_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseContact" ADD CONSTRAINT "ResponseContact_contacatId_fkey" FOREIGN KEY ("contacatId") REFERENCES "ContactForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseContact" ADD CONSTRAINT "ResponseContact_RespondenId_fkey" FOREIGN KEY ("RespondenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
