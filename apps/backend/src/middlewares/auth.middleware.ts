import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';
import { redis } from '../config/redis';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 'توکن ارائه نشده', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    // چک کن توکن blacklist نشده
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return sendError(res, 'توکن منقضی شده', 401);
    }
    
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return sendError(res, 'توکن نامعتبر', 401);
  }
};

export const authenticateOptional = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      req.user = payload;
    }
    next();
  } catch {
    next();
  }
};