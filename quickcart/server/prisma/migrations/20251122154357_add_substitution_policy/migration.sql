-- AlterTable
ALTER TABLE `cartitem` ADD COLUMN `substitution` ENUM('REFUND', 'REPLACE') NOT NULL DEFAULT 'REFUND';

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `substitution` ENUM('REFUND', 'REPLACE') NOT NULL DEFAULT 'REFUND';
