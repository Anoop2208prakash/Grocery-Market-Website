import asyncHandler from 'express-async-handler';
import type { Response } from 'express';
import prisma from '../../lib/prisma';
import type { AuthRequest } from '../auth/auth.middleware';

/**
 * @desc    Get available orders for delivery
 * @route   GET /api/delivery/available
 * @access  Private/Driver
 */
export const getAvailableOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: {
      // FIX: Ensure this matches the exact status in your Admin Panel
      status: 'READY_FOR_PICKUP', 
      // Ensure the order doesn't already have an active delivery record
      OR: [
        { delivery: null },
        { delivery: { status: 'PENDING' } }
      ]
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
          user: { select: { name: true, phone: true } },
          address: true,
        },
      },
    },
  });

  res.json(deliveries);
});

/**
 * @desc    Get Driver Stats
 */
export const getDriverStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driverId = req.user?.id;

  const allDeliveries = await prisma.delivery.findMany({
    where: {
      driverId: driverId,
      status: 'DELIVERED',
    },
    include: {
      order: { select: { totalPrice: true } }
    }
  });

  const totalOrderValue = allDeliveries.reduce((acc, delivery) => acc + delivery.order.totalPrice, 0);
  const totalEarnings = totalOrderValue * 0.20;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayDeliveries = await prisma.delivery.findMany({
    where: {
      driverId: driverId,
      status: 'DELIVERED',
      deliveredAt: { gte: todayStart }
    },
    include: {
      order: { select: { totalPrice: true } }
    }
  });

  const todayOrderValue = todayDeliveries.reduce((acc, delivery) => acc + delivery.order.totalPrice, 0);
  const todayEarnings = todayOrderValue * 0.20;

  res.json({
    completedOrders: allDeliveries.length,
    totalEarnings: Math.round(totalEarnings),
    todayEarnings: Math.round(todayEarnings),
  });
});

/**
 * @desc    Driver accepts an order
 */
export const acceptOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;
  const driverId = req.user?.id;

  if (!driverId) throw new Error('Driver not found');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });

  // Allow acceptance if no delivery exists OR existing delivery is still PENDING
  if (!order || (order.delivery && order.delivery.status !== 'PENDING')) {
    res.status(400);
    throw new Error('Order not available');
  }

  const result = await prisma.$transaction([
    // Update or Create delivery record
    prisma.delivery.upsert({
      where: { orderId: orderId },
      update: {
        driverId: driverId,
        status: 'OUT_FOR_DELIVERY',
        pickedUpAt: new Date(),
      },
      create: {
        orderId: orderId,
        driverId: driverId,
        status: 'OUT_FOR_DELIVERY',
        pickedUpAt: new Date(),
      }
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