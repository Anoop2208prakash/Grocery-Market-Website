import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { UserRole } from '@prisma/client';

// Extend the Express Request type to include our user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

export const protect = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        // Get token from header
        token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        // Get user from the token
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, role: true }, // Only select what we need
        });

        if (!user) {
          res.status(401);
          throw new Error('Not authorized, user not found');
        }

        req.user = user; // Attach user to the request object
        next();
      } catch (error) {
        console.error(error);
        res.status(401);
        throw new Error('Not authorized, token failed');
      }
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }
  }
);

// Middleware to check for Admin role
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN)) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

// --- NEW: Packer Middleware ---
export const packer = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'PACKER' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a packer');
  }
};