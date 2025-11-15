import asyncHandler from 'express-async-handler';
import type { Response } from 'express';
import prisma from '../../lib/prisma';
import type { AuthRequest } from '../auth/auth.middleware';

/**
 * @desc    Get available orders for delivery (Status = PACKING or CONFIRMED)
 * @route   GET /api/delivery/available
 * @access  Private/Driver
 */
export const getAvailableOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PACKING'] }, // Orders ready for pickup
      delivery: { is: null }, // Not yet assigned to a delivery
    },
    include: {
      user: { select: { name: true, phone: true } }, // Customer info
      // vvv THIS IS THE FIX vvv
      _count: {
        select: { items: true } // Correct way to count related items in Prisma
      },
      // ^^^ THIS IS THE FIX ^^^
    },
    orderBy: { createdAt: 'asc' }, // Oldest first
  });

  res.json(orders);
});

/**
 * @desc    Get orders currently assigned to this driver
 * @route   GET /api/delivery/my-deliveries
 * @access  Private/Driver
 */
export const getMyDeliveries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driverId = req.user?.id;

  const deliveries = await prisma.delivery.findMany({
    where: {
      driverId: driverId,
      status: { not: 'DELIVERED' }, // Only active deliveries
    },
    include: {
      order: {
        include: {
          user: { select: { name: true, phone: true, addresses: true } },
        },
      },
    },
  });

  res.json(deliveries);
});

/**
 * @desc    Driver accepts an order
 * @route   POST /api/delivery/:orderId/accept
 * @access  Private/Driver
 */
export const acceptOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const driverId = req.user?.id;

  if (!driverId) throw new Error('Driver not found');

  // 1. Check if order exists and is available
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });

  if (!order || order.delivery) {
    res.status(400);
    throw new Error('Order not available');
  }

  // 2. Create Delivery record and Update Order status
  const result = await prisma.$transaction([
    prisma.delivery.create({
      data: {
        orderId: orderId,
        driverId: driverId,
        status: 'OUT_FOR_DELIVERY',
        pickedUpAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: 'OUT_FOR_DELIVERY' },
    }),
  ]);

  res.json(result[0]);
});

/**
 * @desc    Mark order as delivered
 * @route   PUT /api/delivery/:deliveryId/complete
 * @access  Private/Driver
 */
export const completeDelivery = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deliveryId } = req.params;

  // 1. Update Delivery
  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
    },
  });

  // 2. Update Order
  await prisma.order.update({
    where: { id: delivery.orderId },
    data: { status: 'DELIVERED' },
  });

  res.json(delivery);
});