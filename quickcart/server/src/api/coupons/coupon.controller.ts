import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { DiscountType } from '@prisma/client';

/**
 * @desc    Validate a coupon code
 * @route   POST /api/coupons/validate
 * @access  Private
 */
export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, cartTotal } = req.body;

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() } // Case insensitive check
  });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  if (!coupon.isActive || new Date() > coupon.expiry) {
    res.status(400);
    throw new Error('Coupon has expired');
  }

  // Ensure cartTotal is a number
  const total = parseFloat(cartTotal);

  if (total < coupon.minOrder) {
    res.status(400);
    throw new Error(`Minimum order of ₹${coupon.minOrder} required`);
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (total * coupon.discount) / 100;
  } else {
    discountAmount = coupon.discount;
  }

  // Cap discount at cart total (cannot be negative)
  discountAmount = Math.min(discountAmount, total);

  res.json({
    success: true,
    couponId: coupon.id,
    code: coupon.code,
    discountAmount: discountAmount
  });
});

/**
 * @desc    Get all coupons (Admin)
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
export const getCoupons = asyncHandler(async (req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({
    // --- FIX: Changed 'createdAt' to 'id' ---
    orderBy: { id: 'desc' }
    // ----------------------------------------
  });
  res.json(coupons);
});

/**
 * @desc    Create a coupon (Admin)
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, discount, type, minOrder, expiry } = req.body;

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      discount: parseFloat(discount),
      type: type as DiscountType,
      minOrder: parseFloat(minOrder),
      expiry: new Date(expiry),
    }
  });

  res.status(201).json(coupon);
});

/**
 * @desc    Delete a coupon (Admin)
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.coupon.delete({
    where: { id }
  });
  res.json({ message: 'Coupon removed' });
});