import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🔴 Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'توکن نامعتبر' });
  }
  
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'خطای سرور',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `مسیر ${req.path} پیدا نشد` });
};