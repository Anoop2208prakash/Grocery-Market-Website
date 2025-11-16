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
    select: { id: true, name: true } // Only need names for admin lists
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
      // Include top 10 products in this category
      products: {
        take: 10,
      },
    },
  });

  // Filter out empty categories
  const nonEmptyCategories = categoriesWithProducts.filter(cat => cat.products.length > 0);
  
  res.json(nonEmptyCategories);
});

/**
 * @desc    Get a single category by ID (Used by old "See All" button)
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: true, // Get all products in this category
    },
  });

  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  res.json(category);
});

/**
 * @desc    Get a single category by NAME and all its products
 * @route   GET /api/categories/name/:name
 * @access  Public
 */
export const getCategoryByName = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;

  const category = await prisma.category.findUnique({
    where: { name: name }, // Find by name
    include: {
      products: true, // Get all products in this category
    },
  });

  if (!category) {
    res.status(4404);
    throw new Error('Category not found');
  }

  res.json(category);
});