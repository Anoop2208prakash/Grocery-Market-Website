import asyncHandler from 'express-async-handler';
import type { Response } from 'express';
import prisma from '../../lib/prisma';
import { AuthRequest } from '../auth/auth.middleware';

/**
 * @desc    Get orders to pack (CONFIRMED or PACKING)
 * @route   GET /api/packer/orders
 * @access  Private/Packer
 */
export const getOrdersToPack = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PACKING'] }
    },
    include: {
      items: {
        include: { product: { select: { name: true, sku: true, imageUrl: true } } }
      }
    },
    orderBy: { createdAt: 'asc' } // Oldest first
  });
  res.json(orders);
});

/**
 * @desc    Start packing (Status -> PACKING)
 * @route   PUT /api/packer/:id/start
 * @access  Private/Packer
 */
export const startPacking = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const order = await prisma.order.update({
    where: { id },
    data: { status: 'PACKING' }
  });
  res.json(order);
});

/**
 * @desc    Finish packing (Status -> READY_FOR_PICKUP)
 * @route   PUT /api/packer/:id/ready
 * @access  Private/Packer
 */
export const markReady = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const order = await prisma.order.update({
    where: { id },
    data: { status: 'READY_FOR_PICKUP' }
  });
  res.json(order);
});