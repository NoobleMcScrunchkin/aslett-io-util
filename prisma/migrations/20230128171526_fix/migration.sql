/*
  Warnings:

  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ALTER COLUMN `provider` DROP DEFAULT,
    ALTER COLUMN `userid` DROP DEFAULT;
