import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import type { AuthRequest } from '../auth/auth.middleware';

/**
 * @desc    Fetch all orders
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(orders);
});

/**
 * @desc    Create a new order (with Stock Management)
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cartItems, totalPrice } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401);
    throw new Error('User not found. Not authorized.');
  }

  if (!cartItems || cartItems.length === 0) {
    res.status(400);
    throw new Error('No items in cart');
  }

  // Hardcoded Dark Store ID (Matches seed.ts)
  const darkStoreId = 'clxvw2k9w000008l41111aaaa';

  try {
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. CHECK STOCK for all items first
      for (const item of cartItems) {
        const stockItem = await tx.stockItem.findUnique({
          where: {
            productId_darkStoreId: {
              productId: item.id,
              darkStoreId: darkStoreId,
            },
          },
        });

        if (!stockItem || stockItem.quantity < item.quantity) {
          throw new Error(`Not enough stock for product ID: ${item.id}`);
        }
      }

      // 2. CREATE the Order
      const order = await tx.order.create({
        data: {
          userId: userId,
          totalPrice: totalPrice,
          status: 'PENDING',
          darkStoreId: darkStoreId,
        },
      });

      // 3. CREATE OrderItems and DEDUCT Stock
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          },
        });
        await tx.stockItem.update({
          where: {
            productId_darkStoreId: {
              productId: item.id,
              darkStoreId: darkStoreId,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });

    res.status(201).json(newOrder);

  } catch (error: any) {
    console.error('Failed to create order:', error.message);
    res.status(400); 
    throw new Error(error.message || 'Failed to create order');
  }
});

/**
 * @desc    Get a single order by ID
 * @route   GET /api/orders/:id
 * @access  Private/Admin
 */
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true } },
        },
      },
    },
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json(order);
});

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error('No status provided');
  }

  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status: status,
    },
  });

  res.json(updatedOrder);
});

/**
 * @desc    Get logged in user's orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401);
    throw new Error('User not found');
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: userId,
    },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(orders);
});

/**
 * @desc    Get order statistics for charts
 * @route   GET /api/orders/stats
 * @access  Private/Admin
 */
export const getOrderStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period } = req.query;
  let query;
  
  const baseQuery = "SELECT SUM(`totalPrice`) as total, DATE_FORMAT(`createdAt`, '%Y-%m-%d') as date FROM `order` WHERE `status` = 'DELIVERED'";

  switch (period) {
    case 'daily':
      query = `
        ${baseQuery} AND \`createdAt\` >= CURDATE() - INTERVAL 7 DAY
        GROUP BY DATE(\`createdAt\`)
        ORDER BY DATE(\`createdAt\`) ASC;
      `;
      break;
    case 'weekly':
      query = `
        SELECT SUM(\`totalPrice\`) as total, DATE_FORMAT(DATE_SUB(\`createdAt\`, INTERVAL WEEKDAY(\`createdAt\`) DAY), '%Y-%m-%d') as date
        FROM \`order\` WHERE \`status\` = 'DELIVERED' AND \`createdAt\` >= CURDATE() - INTERVAL 12 WEEK
        GROUP BY YEARWEEK(\`createdAt\`)
        ORDER BY YEARWEEK(\`createdAt\`) ASC;
      `;
      break;
    case 'yearly':
      query = `
        SELECT SUM(\`totalPrice\`) as total, DATE_FORMAT(\`createdAt\`, '%Y-01-01') as date
        FROM \`order\` WHERE \`status\` = 'DELIVERED' AND \`createdAt\` >= CURDATE() - INTERVAL 5 YEAR
        GROUP BY YEAR(\`createdAt\`)
        ORDER BY YEAR(\`createdAt\`) ASC;
      `;
      break;
    case 'monthly':
    default:
      query = `
        ${baseQuery} AND \`createdAt\` >= CURDATE() - INTERVAL 12 MONTH
        GROUP BY DATE_FORMAT(\`createdAt\`, '%Y-%m-01')
        ORDER BY DATE_FORMAT(\`createdAt\`, '%Y-%m-01') ASC;
      `;
      break;
  }

  const results = await prisma.$queryRawUnsafe(query);
  
  const stringifiedResults = (results as any[]).map(item => ({
    ...item,
    total: item.total ? item.total.toString() : '0',
    date: item.date ? item.date.toString() : 'N/A'
  }));

  res.json(stringifiedResults);
});