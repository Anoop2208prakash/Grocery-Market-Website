import asyncHandler from 'express-async-handler';
import type { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import PDFDocument from 'pdfkit';
import path from 'path';

export const generateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  // 1. Fetch Order Data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      address: true,
      items: {
        include: { product: true }
      }
    }
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // 2. Set up PDF Stream
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId.slice(-6)}.pdf`);

  doc.pipe(res); // Send PDF directly to the client

  // --- 3. DESIGN THE INVOICE ---

  // Header
  doc.fontSize(20).text('QuickCart', { align: 'left' })
     .fontSize(10).text('123 Grocery Street, Jaipur, India', { align: 'left' })
     .moveDown();

  // Title
  doc.fontSize(18).text('INVOICE', { align: 'right' })
     .fontSize(10).text(`Order ID: #${order.id.slice(-6).toUpperCase()}`, { align: 'right' })
     .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' })
     .moveDown();

  // Customer Details
  doc.text(`Bill To:`, { underline: true })
     .text(order.user.name || 'Customer')
     .text(order.user.email)
     .text(order.address ? `${order.address.street}, ${order.address.city}` : 'No Address')
     .moveDown();

  // Table Header
  const tableTop = 250;
  doc.font('Helvetica-Bold');
  doc.text('Item', 50, tableTop)
     .text('Quantity', 300, tableTop)
     .text('Price', 370, tableTop)
     .text('Total', 450, tableTop);

  // Draw Line
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Items Loop
  let position = tableTop + 30;
  doc.font('Helvetica');

  order.items.forEach((item) => {
    const total = item.price * item.quantity;
    
    doc.text(item.product.name.substring(0, 30), 50, position)
       .text(item.quantity.toString(), 300, position)
       .text(`Rs.${item.price}`, 370, position)
       .text(`Rs.${total}`, 450, position);
    
    position += 20;
  });

  // Total
  doc.moveDown()
     .fontSize(14).font('Helvetica-Bold')
     .text(`Grand Total: Rs.${order.totalPrice.toFixed(2)}`, 400, position + 20);

  // Footer
  doc.fontSize(10).font('Helvetica')
     .text('Thank you for shopping with QuickCart!', 50, 700, { align: 'center' });

  // 4. Finalize PDF
  doc.end();
});