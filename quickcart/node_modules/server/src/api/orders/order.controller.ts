import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { getIO } from '../../socket';

// --- Interface for Request with User ---
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    cartItems,
    addressId,
    paymentMethod,
    totalPrice,
    couponCode
  } = req.body;

  if (!cartItems || cartItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  let couponId = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (coupon) couponId = coupon.id;
  }

  const order = await prisma.order.create({
    data: {
      userId: req.user!.id,
      addressId: addressId,
      totalPrice: parseFloat(totalPrice),
      paymentMethod: paymentMethod,
      couponId: couponId,
      darkStoreId: 'clxvw2k9w000008l41111aaaa',
      status: 'PENDING',
      items: {
        create: cartItems.map((item: any) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          substitution: item.substitution || 'REFUND'
        })),
      },
      delivery: {
        create: { status: 'PENDING' }
      }
    },
  });

  try {
    getIO().emit('new_order', { id: order.id, totalPrice: order.totalPrice });
  } catch (error) {
    console.log("Socket emit skipped");
  }

  res.status(201).json(order);
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { product: true } },
      address: true,
      delivery: { include: { driver: { select: { name: true, phone: true } } } }
    },
  });

  if (order) {
    if (req.user && (req.user.role === 'ADMIN' || req.user.id === order.userId)) {
      res.json(order);
    } else {
      res.status(401);
      throw new Error('Not authorized to view this order');
    }
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  res.json(orders);
});

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true } },
      delivery: true
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

/**
 * @desc    Update order to PAID
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
export const updateOrderToPaid = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (order) {
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
    });
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Update order to DELIVERED
 * @route   PUT /api/orders/:id/deliver
 * @access  Private/Admin
 */
export const updateOrderToDelivered = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (order) {
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'DELIVERED',
        delivery: {
          update: {
            status: 'DELIVERED',
            deliveredAt: new Date()
          }
        }
      },
    });

    try {
      getIO().to(`order_${order.id}`).emit('order_status_updated', { status: 'DELIVERED' });
    } catch (e) { }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Cancel Order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (order) {
    if (req.user?.role !== 'ADMIN' && order.userId !== req.user?.id) {
      res.status(401);
      throw new Error('Not authorized to cancel this order');
    }

    if (order.status !== 'PENDING') {
      res.status(400);
      throw new Error('Cannot cancel order that is already processed or delivered');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        delivery: { update: { status: 'CANCELLED' } }
      },
    });

    try {
      getIO().emit('order_cancelled', { id: order.id });
    } catch (e) { }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Get Revenue Statistics (Graph Data)
 * @route   GET /api/orders/revenue
 * @access  Private/Admin
 */
export const getRevenueStats = asyncHandler(async (req: Request, res: Response) => {
  // Aggregate total revenue for orders marked as DELIVERED
  const totalRevenueAgg = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { status: 'DELIVERED' }
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Fetch orders for the graph, excluding CANCELLED ones
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      status: 'DELIVERED'
    },
    select: {
      createdAt: true,
      totalPrice: true
    }
  });

  const dailyMap = new Map<string, number>();

  // Pre-fill last 7 days with formatted date strings
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap.set(dateStr, 0);
  }

  orders.forEach((order) => {
    const dateStr = order.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + order.totalPrice);
    }
  });

  const graphData = Array.from(dailyMap, ([date, total]) => ({
    name: date,
    total: total
  }));

  res.json({
    totalRevenue: totalRevenueAgg._sum.totalPrice || 0,
    graphData
  });
});

/**
 * @desc    Update Order Status (Generic - For Packing/Ready/etc)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (order) {
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: status },
      include: { address: true }
    });

    if (status === 'DELIVERED' || status === 'CANCELLED') {
      await prisma.delivery.updateMany({
        where: { orderId: order.id },
        data: { 
          status: status, 
          deliveredAt: status === 'DELIVERED' ? new Date() : null 
        }
      });
    }

    try {
      getIO().to(`order_${order.id}`).emit('order_status_updated', { status });
    } catch (e) { }

    if (['READY', 'READY_FOR_PICKUP', 'PACKED', 'PACKING'].includes(status)) {
      try {
        getIO().emit('driver_order_ready', updatedOrder);
      } catch (e) {
        console.error("Driver notification failed:", e);
      }
    }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

/**
 * @desc    Get Available Orders for Drivers
 * @route   GET /api/orders/available
 * @access  Private/Driver
 */
export const getAvailableOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ['READY', 'READY_FOR_PICKUP', 'PACKED', 'PACKING']
      },
      delivery: {
        is: null
      }
    },
    include: {
      user: { select: { name: true, phone: true } },
      address: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  res.json(orders);
});