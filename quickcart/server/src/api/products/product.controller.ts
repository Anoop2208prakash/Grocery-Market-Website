import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';

// Hardcoded Dark Store ID (Matches the one in your seed.ts)
const DARK_STORE_ID = 'clxvw2k9w000008l41111aaaa';

/**
 * @desc    Fetch all products (with stock)
 * @route   GET /api/products
 * @access  Private
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
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
      // Only get stock for our specific dark store
      stockItems: {
        where: { darkStoreId: DARK_STORE_ID } 
      },
    },
  });

  if (product) {
    // Get the specific stock quantity, or 0 if none exists
    const currentStock = product.stockItems[0]?.quantity || 0;
    // Return product data mixed with the stock count
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
  // We now extract 'stock' from the body
  const { name, sku, price, description, categoryId, stock } = req.body;

  if (!name || !sku || !price || !categoryId) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const skuExists = await prisma.product.findUnique({ where: { sku } });
  if (skuExists) {
    res.status(400);
    throw new Error('Product with this SKU already exists');
  }

  // Use transaction to create Product AND StockItem simultaneously
  const product = await prisma.$transaction(async (tx) => {
    // 1. Create the Product
    const newProduct = await tx.product.create({
      data: {
        name,
        sku,
        price: parseFloat(price),
        description,
        categoryId,
      },
    });

    // 2. Create the initial Stock Item
    await tx.stockItem.create({
      data: {
        productId: newProduct.id,
        darkStoreId: DARK_STORE_ID,
        quantity: parseInt(stock) || 0, // Default to 0 if no stock provided
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
  // We now extract 'stock' from the body
  const { name, sku, price, description, categoryId, stock } = req.body;

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

  // Use transaction to update Product AND StockItem
  const updatedProduct = await prisma.$transaction(async (tx) => {
    // 1. Update Product details
    const p = await tx.product.update({
      where: { id },
      data: {
        name: name || product.name,
        sku: sku || product.sku,
        price: price ? parseFloat(price) : product.price,
        description: description || product.description,
        categoryId: categoryId || product.categoryId,
      },
    });

    // 2. Update (or Create) Stock Item if stock value is sent
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
 * @desc    Delete a product
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

  await prisma.product.delete({ where: { id } });
  res.json({ message: 'Product removed' });
});