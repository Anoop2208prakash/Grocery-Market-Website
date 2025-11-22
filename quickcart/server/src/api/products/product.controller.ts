import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import type { AuthRequest } from '../auth/auth.middleware';

// Hardcoded Dark Store ID (Matches the one in your seed.ts)
const DARK_STORE_ID = 'clxvw2k9w000008l41111aaaa';

/**
 * @desc    Fetch all products (with search, filter, and sort)
 * @route   GET /api/products?search=...&minPrice=...&maxPrice=...&categoryId=...&sort=...
 * @access  Public
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { search, minPrice, maxPrice, categoryId, sort } = req.query;

  const whereClause: any = {};

  // 1. Search Filter (Name OR Description) - MySQL Compatible
  if (search && typeof search === 'string') {
    whereClause.OR = [
      { name: { contains: search } },
      { description: { contains: search } }
    ];
  }

  // 2. Category Filter
  if (categoryId && typeof categoryId === 'string') {
    whereClause.categoryId = categoryId;
  }

  // 3. Price Filter
  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price.gte = parseFloat(minPrice as string);
    if (maxPrice) whereClause.price.lte = parseFloat(maxPrice as string);
  }

  // 4. Sorting Logic
  let orderBy: any = { createdAt: 'desc' }; 
  if (sort === 'price-asc') orderBy = { price: 'asc' };
  if (sort === 'price-desc') orderBy = { price: 'desc' };

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: true,
      stockItems: true,
    },
    orderBy: orderBy,
  });

  // Calculate total stock
  const productsWithStock = products.map((p) => {
    const totalStock = p.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    return { ...p, totalStock };
  });

  res.json(productsWithStock);
});

/**
 * @desc    Get a single product by ID (with stock for current store)
 * @route   GET /api/products/:id
 * @access  Private/Admin
 */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      stockItems: {
        where: { darkStoreId: DARK_STORE_ID } 
      },
    },
  });

  if (product) {
    const currentStock = product.stockItems[0]?.quantity || 0;
    res.json({ ...product, stock: currentStock });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Create a new product (and set initial stock)
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, sku, price, description, categoryId, stock, imageUrl } = req.body;

  if (!name || !sku || !price || !categoryId) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const skuExists = await prisma.product.findUnique({ where: { sku } });
  if (skuExists) {
    res.status(400);
    throw new Error('Product with this SKU already exists');
  }

  // Use transaction to create Product AND StockItem
  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        name,
        sku,
        price: parseFloat(price),
        description,
        categoryId,
        imageUrl: imageUrl || null, 
      },
    });

    // Create initial stock entry
    await tx.stockItem.create({
      data: {
        productId: newProduct.id,
        darkStoreId: DARK_STORE_ID,
        quantity: parseInt(stock) || 0,
      },
    });

    return newProduct;
  });

  res.status(201).json(product);
});

/**
 * @desc    Update a product (and update stock)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, sku, price, description, categoryId, stock, imageUrl } = req.body;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (sku && sku !== product.sku) {
    const skuExists = await prisma.product.findUnique({ where: { sku } });
    if (skuExists) {
      res.status(400);
      throw new Error('Product with this SKU already exists');
    }
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const p = await tx.product.update({
      where: { id },
      data: {
        name: name || product.name,
        sku: sku || product.sku,
        price: price ? parseFloat(price) : product.price,
        description: description || product.description,
        categoryId: categoryId || product.categoryId,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : product.imageUrl,
      },
    });

    if (stock !== undefined) {
      await tx.stockItem.upsert({
        where: {
          productId_darkStoreId: {
            productId: id,
            darkStoreId: DARK_STORE_ID,
          },
        },
        update: { quantity: parseInt(stock) },
        create: {
          productId: id,
          darkStoreId: DARK_STORE_ID,
          quantity: parseInt(stock),
        },
      });
    }

    return p;
  });

  res.json(updatedProduct);
});

/**
 * @desc    Delete a product (Safe Delete)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const orderItemCount = await prisma.orderItem.count({
    where: { productId: id }
  });

  if (orderItemCount > 0) {
    res.status(400);
    throw new Error('Cannot delete product. It is part of existing orders.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockItem.deleteMany({
      where: { productId: id },
    });
    await tx.cartItem.deleteMany({
      where: { productId: id },
    });
    await tx.product.delete({ 
      where: { id } 
    });
  });

  res.json({ message: 'Product removed' });
});


// --- DASHBOARD STATS FUNCTIONS ---

/**
 * @desc    Get product count by category for chart
 * @route   GET /api/products/stats/category
 * @access  Private/Admin
 */
export const getProductStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  const formattedStats = stats.map(cat => ({
    name: cat.name,
    count: cat._count.products,
  }));

  res.json(formattedStats);
});

/**
 * @desc    Get all products with low stock (<= 20)
 * @route   GET /api/products/stats/lowstock
 * @access  Private/Admin
 */
export const getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
  const lowStockItems = await prisma.stockItem.findMany({
    where: {
      quantity: {
        lte: 20,
      },
    },
    include: {
      product: {
        select: { name: true, sku: true },
      },
    },
    orderBy: {
      quantity: 'asc', 
    },
  });

  res.json(lowStockItems);
});

// --- vvv ADDED NEW FUNCTION vvv ---

/**
 * @desc    Get products the user has bought before
 * @route   GET /api/products/buy-again
 * @access  Private
 */
export const getBuyAgainProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.json([]); // Return empty if not logged in
    return;
  }

  // Find distinct product IDs from user's completed orders
  const distinctItems = await prisma.orderItem.findMany({
    where: {
      order: {
        userId: userId,
        status: { in: ['DELIVERED', 'OUT_FOR_DELIVERY', 'CONFIRMED'] } // Items they actually bought
      }
    },
    distinct: ['productId'],
    select: {
      productId: true
    },
    take: 10 // Limit to 10 items
  });

  const productIds = distinctItems.map(item => item.productId);

  // Fetch the full product details
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds }
    },
    include: {
      category: true,
      stockItems: true
    }
  });

  // Calculate total stock
  const productsWithStock = products.map((p) => {
    const totalStock = p.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    return { ...p, totalStock };
  });

  res.json(productsWithStock);
});