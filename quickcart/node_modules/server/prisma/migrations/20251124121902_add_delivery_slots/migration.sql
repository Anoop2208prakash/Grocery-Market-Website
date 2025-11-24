-- AlterTable
ALTER TABLE `order` ADD COLUMN `deliverySlotId` VARCHAR(191) NULL,
    ADD COLUMN `deliveryType` ENUM('EXPRESS', 'STANDARD') NOT NULL DEFAULT 'EXPRESS';

-- CreateTable
CREATE TABLE `DeliverySlot` (
    `id` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 5,

    INDEX `DeliverySlot_startTime_idx`(`startTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_deliverySlotId_fkey` FOREIGN KEY (`deliverySlotId`) REFERENCES `DeliverySlot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
