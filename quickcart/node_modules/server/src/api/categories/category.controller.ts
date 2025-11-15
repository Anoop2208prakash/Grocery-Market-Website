import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});