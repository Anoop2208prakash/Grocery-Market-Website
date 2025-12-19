import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';

/**
 * @desc    Get all categories (names only)
 * @route   GET /api/categories
 * @access  Private/Admin
 */
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });
  res.json(categories);
});

/**
 * @desc    Get all categories and their top 10 products
 * @route   GET /api/categories/products
 * @access  Public
 */
export const getCategoriesWithProducts = asyncHandler(async (req: Request, res: Response) => {
  const categoriesWithProducts = await prisma.category.findMany({
    include: {
      products: {
        take: 10,
        include: { subCategory: true }
      },
    },
  });

  const nonEmptyCategories = categoriesWithProducts.filter(cat => cat.products.length > 0);
  res.json(nonEmptyCategories);
});

/**
 * @desc    Get a single category by ID OR Name
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // --- FIX: Search by ID OR Name ---
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { id: id },    // Check if param matches ID
        { name: id }   // Check if param matches Name (e.g. "Vegetables")
      ]
    },
    include: {
      subCategories: true,
      products: {
        include: { subCategory: true }
      },
    },
  });
  // ---------------------------------

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json(category);
});

/**
 * @desc    Get a single category by NAME
 * @route   GET /api/categories/name/:name
 * @access  Public
 */
export const getCategoryByName = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;

  const category = await prisma.category.findUnique({
    where: { name: name },
    include: {
      subCategories: true,
      products: {
        include: { subCategory: true }
      },
    },
  });

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json(category);
});