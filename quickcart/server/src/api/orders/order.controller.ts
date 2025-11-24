import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import type { AuthRequest } from '../auth/auth.middleware';

// Helper: Calculate distance between two coordinates (Haversine Formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

/**
 * @desc    Fetch all orders
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: { product: { select: { name: true } } },
      },
      darkStore: { select: { name: true } }, // Include Store Name
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
});

/**
 * @desc    Create a new order (with Smart Routing & Stock Check)
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { cartItems, totalPrice, addressId, paymentMethod = 'COD' } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401);
    throw new Error('User not found. Not authorized.');
  }
  if (!cartItems || cartItems.length === 0) {
    res.status(400);
    throw new Error('No items in cart');
  }
  if (!addressId) {
    res.status(400);
    throw new Error('No delivery address provided');
  }

  // --- 1. SMART ROUTING LOGIC ---
  
  // A. Get the User's Location
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  let selectedStoreId = 'clxvw2k9w000008l41111aaaa'; // Default Fallback

  // B. If address has coordinates, find the nearest store
  if (address.lat && address.lng) {
    const allStores = await prisma.darkStore.findMany();
    
    let minDistance = Infinity;
    let nearestStore = null;

    for (const store of allStores) {
      const dist = getDistanceFromLatLonInKm(address.lat, address.lng, store.lat, store.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStore = store;
      }
    }

    if (nearestStore) {
      selectedStoreId = nearestStore.id;
      console.log(`Routing Order to Nearest Store: ${nearestStore.name} (${minDistance.toFixed(2)}km away)`);
    }
  } else {
    console.log('Address has no coordinates, using default store.');
  }
  
  // --- END ROUTING LOGIC ---

  try {
    const newOrder = await prisma.$transaction(async (tx) => {
      
      // 2. CHECK STOCK (At the SELECTED store)
      for (const item of cartItems) {
        const stockItem = await tx.stockItem.findUnique({
          where: {
            productId_darkStoreId: {
              productId: item.id,
              darkStoreId: selectedStoreId, // Use dynamic store ID
            },
          },
        });

        if (!stockItem || stockItem.quantity < item.quantity) {
          // Better error message
          throw new Error(`Product "${item.name}" is out of stock at your nearest store.`);
        }
      }

      // 3. HANDLE WALLET PAYMENT
      if (paymentMethod === 'WALLET') {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.walletBalance < totalPrice) {
          throw new Error('Insufficient wallet balance. Please add money or choose COD.');
        }
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: totalPrice } }
        });
        await tx.walletTransaction.create({
          data: {
            userId,
            amount: totalPrice,
            type: 'DEBIT',
            description: 'Payment for grocery order',
          }
        });
      }

      // 4. CREATE the Order
      const order = await tx.order.create({
        data: {
          userId: userId,
          totalPrice: totalPrice,
          status: 'PENDING',
          darkStoreId: selectedStoreId, // Save the assigned store
          addressId: addressId,
          paymentMethod: paymentMethod,
        },
      });

      // 5. CREATE Items & DEDUCT Stock
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            substitution: item.substitution || 'REFUND',
          },
        });
        
        // Deduct from the correct store
        await tx.stockItem.update({
          where: {
            productId_darkStoreId: {
              productId: item.id,
              darkStoreId: selectedStoreId,
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
      items: { include: { product: { select: { name: true, sku: true, imageUrl: true } } } }, // Include image
      darkStore: { select: { name: true } }, // Include store name
    },
  });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    res.status(400);
    throw new Error('No status provided');
  }
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status: status },
  });
  res.json(updatedOrder);
});

export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401);
    throw new Error('User not found');
  }
  const orders = await prisma.order.findMany({
    where: { userId: userId },
    include: {
      items: { include: { product: { select: { name: true, price: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

/**
 * @desc    Get order statistics for charts (REVENUE)
 * @route   GET /api/orders/stats
 * @access  Private/Admin
 */
export const getOrderStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period } = req.query;
  let query;
  
  // Use 'order_date' alias to group correctly in MySQL strict mode
  switch (period) {
    case 'daily':
      query = `
        SELECT SUM(\`totalPrice\`) as total, DATE_FORMAT(\`createdAt\`, '%Y-%m-%d') as order_date 
        FROM \`order\` 
        WHERE \`status\` = 'DELIVERED' AND \`createdAt\` >= CURDATE() - INTERVAL 7 DAY
        GROUP BY order_date
        ORDER BY order_date ASC;
      `;
      break;
    case 'weekly':
      query = `
        SELECT SUM(\`totalPrice\`) as total, DATE_FORMAT(DATE_SUB(\`createdAt\`, INTERVAL WEEKDAY(\`createdAt\`) DAY), '%Y-%m-%d') as order_date
        FROM \`order\` WHERE \`status\` = 'DELIVERED' AND \`createdAt\` >= CURDATE() - INTERVAL 12 WEEK
        GROUP BY order_date
        ORDER BY order_date ASC;
      `;
      break;
    case 'yearly':
      query = `
        SELECT SUM(\`totalPrice\`) as total, DATE_FORMAT(\`createdAt\`, '%Y-01-01') as order_date
        FROM \`order\` WHERE \`status\` = 'DELIVERED' AND \`createdAt\` >= CURDATE() - INTERVAL 5 YEAR
        GROUP BY order_date
        ORDER BY order_date ASC;
      `;
      break;
    case 'monthly':
    default:
      query = `
        SELECT SUM(\`totalPrice\`) as total, DATE_FORMAT(\`createdAt\`, '%Y-%m-01') as order_date
        FROM \`order\` 
        WHERE \`status\` = 'DELIVERED' AND \`createdAt\` >= CURDATE() - INTERVAL 12 MONTH
        GROUP BY order_date
        ORDER BY order_date ASC;
      `;
      break;
  }

  const results = await prisma.$queryRawUnsafe(query);
  const stringifiedResults = (results as any[]).map(item => ({
    ...item,
    total: item.total ? item.total.toString() : '0',
    date: item.order_date ? item.order_date.toString() : 'N/A' // Map back to 'date' for frontend
  }));
  res.json(stringifiedResults);
});

/**
 * @desc    Get order COUNT statistics for charts (ORDERS)
 * @route   GET /api/orders/stats/count
 * @access  Private/Admin
 */
export const getOrderCountStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { period } = req.query;
  let query;
  
  // Use 'order_date' alias to group correctly in MySQL strict mode
  switch (period) {
    case 'daily':
      query = `
        SELECT COUNT(id) as total, DATE_FORMAT(\`createdAt\`, '%Y-%m-%d') as order_date 
        FROM \`order\` 
        WHERE 1=1 AND \`createdAt\` >= CURDATE() - INTERVAL 7 DAY
        GROUP BY order_date
        ORDER BY order_date ASC;
      `;
      break;
    case 'weekly':
      query = `
        SELECT COUNT(id) as total, DATE_FORMAT(DATE_SUB(\`createdAt\`, INTERVAL WEEKDAY(\`createdAt\`) DAY), '%Y-%m-%d') as order_date
        FROM \`order\` WHERE 1=1 AND \`createdAt\` >= CURDATE() - INTERVAL 12 WEEK
        GROUP BY order_date
        ORDER BY order_date ASC;
      `;
      break;
    case 'yearly':
      query = `
        SELECT COUNT(id) as total, DATE_FORMAT(\`createdAt\`, '%Y-01-01') as order_date
        FROM \`order\` WHERE 1=1 AND \`createdAt\` >= CURDATE() - INTERVAL 5 YEAR
        GROUP BY order_date
        ORDER BY order_date ASC;
      `;
      break;
    case 'monthly':
    default:
      query = `
        SELECT COUNT(id) as total, DATE_FORMAT(\`createdAt\`, '%Y-%m-01') as order_date
        FROM \`order\` WHERE 1=1 AND \`createdAt\` >= CURDATE() - INTERVAL 12 MONTH
        GROUP BY order_date
        ORDER BY order_date ASC;
      `;
      break;
  }

  const results = await prisma.$queryRawUnsafe(query);
  const stringifiedResults = (results as any[]).map(item => ({
    ...item,
    total: item.total ? item.total.toString() : '0',
    date: item.order_date ? item.order_date.toString() : 'N/A'
  }));
  res.json(stringifiedResults);
});

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.userId !== userId && req.user?.role !== 'ADMIN') { res.status(403); throw new Error('Not authorized'); }
  if (['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(order.status)) { res.status(400); throw new Error(`Cannot cancel order that is ${order.status}`); }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    const darkStoreId = order.darkStoreId;
    for (const item of order.items) {
      await tx.stockItem.update({
        where: { productId_darkStoreId: { productId: item.productId, darkStoreId } },
        data: { quantity: { increment: item.quantity } }
      });
    }
    if (order.paymentMethod === 'WALLET' || order.paymentMethod === 'UPI') {
       await tx.user.update({ where: { id: order.userId }, data: { walletBalance: { increment: order.totalPrice } } });
       await tx.walletTransaction.create({
         data: { userId: order.userId, amount: order.totalPrice, type: 'CREDIT', description: order.paymentMethod === 'UPI' ? `Refund for Order #${order.id.slice(-6)} (UPI Reversal)` : `Refund for Order #${order.id.slice(-6)}` }
       });
    }
    return cancelled;
  });
  res.json(updatedOrder);
});