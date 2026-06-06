import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../types';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('ایمیل نامعتبر'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
});

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body.email, body.password);
      return sendSuccess(res, result, 'ورود موفق');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  },
  
  async logout(req: AuthRequest, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1]!;
      await authService.logout(token);
      return sendSuccess(res, null, 'خروج موفق');
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async getMe(req: AuthRequest, res: Response) {
    try {
      const user = await authService.getMe(req.user!.userId);
      return sendSuccess(res, user);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  },
};