/*
  Warnings:

  - The values [PACKING,OUT_FOR_DELIVERY] on the enum `Delivery_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [PACKING,OUT_FOR_DELIVERY] on the enum `Delivery_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `delivery` MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'READY', 'READY_FOR_PICKUP') NOT NULL;

-- AlterTable
ALTER TABLE `order` MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'READY', 'READY_FOR_PICKUP') NOT NULL DEFAULT 'PENDING';
