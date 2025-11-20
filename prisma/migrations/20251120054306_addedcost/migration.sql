/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Jewelry` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Jewelry` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Jewelry` table. All the data in the column will be lost.
  - Added the required column `cost` to the `Jewelry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retail` to the `Jewelry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Jewelry" DROP COLUMN "createdAt",
DROP COLUMN "price",
DROP COLUMN "updatedAt",
ADD COLUMN     "cost" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "retail" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 1;
