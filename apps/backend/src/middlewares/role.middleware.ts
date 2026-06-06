import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'احراز هویت لازم است', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'دسترسی ندارید', 403);
    }
    next();
  };
};

export const requireSuperAdmin = requireRole('super_admin');
export const requireOwner = requireRole('super_admin', 'owner');
export const requireManager = requireRole('super_admin', 'owner', 'manager');
export const requireStaff = requireRole('super_admin', 'owner', 'manager', 'waiter', 'chef');