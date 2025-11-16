import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';

// Hardcoded Dark Store ID (Matches the one in your seed.ts)
const DARK_STORE_ID = 'clxvw2k9w000008l41111aaaa';

/**
 * @desc    Fetch all products (with stock AND search)
 * @route   GET /api/products?search=...
 * @access  Public
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const whereClause: any = {};
  if (search && typeof search === 'string') {
    whereClause.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  const products = await prisma.product.findMany({
    where: whereClause, // Apply the filter
    include: {
      category: true,
      stockItems: true,
    },
  });

  // Calculate total stock for each product
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


// --- vvv ADD THESE TWO NEW FUNCTIONS vvv ---

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
  // This finds all stock items with quantity 20 or less
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
      quantity: 'asc', // Show lowest first
    },
  });

  res.json(lowStockItems);
});