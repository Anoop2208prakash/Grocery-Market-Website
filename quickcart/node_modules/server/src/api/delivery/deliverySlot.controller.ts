import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';

/**
 * @desc    Get available delivery slots for the next 3 days
 * @route   GET /api/slots
 * @access  Private
 */
export const getDeliverySlots = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(now.getDate() + 3);

  const slots = await prisma.deliverySlot.findMany({
    where: {
      startTime: {
        gte: now,
        lte: threeDaysLater
      },
      // Only show slots that aren't full
      // (Prisma doesn't support filtering by relation count easily in 'where', 
      // so we fetch and filter in code for simplicity, or use raw query for performance)
    },
    include: {
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { startTime: 'asc' }
  });

  // Filter out full slots
  const availableSlots = slots.filter(slot => slot._count.orders < slot.capacity);

  res.json(availableSlots);
});