import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';

/**
 * @desc    Get all dark stores
 * @route   GET /api/darkstores
 * @access  Private/Admin
 */
export const getDarkStores = asyncHandler(async (req: Request, res: Response) => {
  const stores = await prisma.darkStore.findMany({
    include: {
      _count: {
        select: { orders: true, inventory: true }
      }
    }
  });
  res.json(stores);
});

/**
 * @desc    Add a new dark store
 * @route   POST /api/darkstores
 * @access  Private/Admin
 */
export const addDarkStore = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, lat, lng } = req.body;

  if (!name || !address || !lat || !lng) {
    res.status(400);
    throw new Error('Please fill all fields');
  }

  const store = await prisma.darkStore.create({
    data: {
      name,
      address,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    }
  });

  // OPTIONAL: Initialize stock for this store (e.g., copy from central)
  // For now, it starts empty.
  
  res.status(201).json(store);
});

/**
 * @desc    Delete a dark store
 * @route   DELETE /api/darkstores/:id
 * @access  Private/Admin
 */
export const deleteDarkStore = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent deleting the "Central" store if you want
  // if (id === 'clxvw2k9w000008l41111aaaa') throw new Error('Cannot delete Main Store');

  await prisma.darkStore.delete({ where: { id } });
  res.json({ message: 'Store removed' });
});