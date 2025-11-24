import asyncHandler from 'express-async-handler';
import type { Response } from 'express';
import prisma from '../../lib/prisma';
import type { AuthRequest } from '../auth/auth.middleware';

/**
 * @desc    Get available orders for delivery (Status = READY_FOR_PICKUP)
 * @route   GET /api/delivery/available
 * @access  Private/Driver
 */
export const getAvailableOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: {
      // --- FIX: Driver only sees READY orders ---
      status: 'READY_FOR_PICKUP', 
      // -----------------------------------------
      delivery: { is: null },
    },
    include: {
      user: { select: { name: true, phone: true } },
      address: true,
      _count: {
        select: { items: true }
      },
    },
    orderBy: { createdAt: 'asc' },
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
      status: { not: 'DELIVERED' },
    },
    include: {
      order: {
        include: {
          user: { select: { name: true, phone: true } }, // removed 'addresses' typo if present in other versions, staying safe with user select
          address: true,
        },
      },
    },
  });

  res.json(deliveries);
});

/**
 * @desc    Get Driver Stats (Earnings = 20% of total order value)
 * @route   GET /api/delivery/stats
 * @access  Private/Driver
 */
export const getDriverStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driverId = req.user?.id;

  // 1. Get ALL completed deliveries for this driver
  const allDeliveries = await prisma.delivery.findMany({
    where: {
      driverId: driverId,
      status: 'DELIVERED',
    },
    include: {
      order: {
        select: { totalPrice: true } // We need the price to calc commission
      }
    }
  });

  // 2. Calculate Total Lifetime Earnings (20% of sum)
  const totalOrderValue = allDeliveries.reduce((acc, delivery) => acc + delivery.order.totalPrice, 0);
  const totalEarnings = totalOrderValue * 0.20;

  // 3. Get TODAY'S completed deliveries
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayDeliveries = await prisma.delivery.findMany({
    where: {
      driverId: driverId,
      status: 'DELIVERED',
      deliveredAt: {
        gte: todayStart
      }
    },
    include: {
      order: {
        select: { totalPrice: true }
      }
    }
  });

  // 4. Calculate Today's Earnings (20% of sum)
  const todayOrderValue = todayDeliveries.reduce((acc, delivery) => acc + delivery.order.totalPrice, 0);
  const todayEarnings = todayOrderValue * 0.20;

  res.json({
    completedOrders: allDeliveries.length,
    totalEarnings: Math.round(totalEarnings), // Round to nearest integer
    todayEarnings: Math.round(todayEarnings),
  });
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

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });

  if (!order || order.delivery) {
    res.status(400);
    throw new Error('Order not available');
  }

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

  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
    },
  });

  await prisma.order.update({
    where: { id: delivery.orderId },
    data: { status: 'DELIVERED' },
  });

  res.json(delivery);
});