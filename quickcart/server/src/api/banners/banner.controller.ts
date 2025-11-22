import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';

/**
 * @desc    Get all active banners (Public)
 * @route   GET /api/banners
 * @access  Public
 */
export const getBanners = asyncHandler(async (req: Request, res: Response) => {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(banners);
});

/**
 * @desc    Create a new banner (Admin)
 * @route   POST /api/banners
 * @access  Private/Admin
 */
export const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const { title, subtitle, imageUrl } = req.body;

  if (!imageUrl) {
    res.status(400);
    throw new Error('Image URL is required');
  }

  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle,
      imageUrl
    }
  });

  res.status(201).json(banner);
});

/**
 * @desc    Delete a banner (Admin)
 * @route   DELETE /api/banners/:id
 * @access  Private/Admin
 */
export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.banner.delete({
    where: { id }
  });

  res.json({ message: 'Banner removed' });
});