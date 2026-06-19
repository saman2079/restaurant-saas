import { Response } from 'express';
import { staffService } from './staff.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../types';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  email: z.string().email('ایمیل نامعتبر'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  role: z.enum(['manager', 'waiter', 'chef']),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['manager', 'waiter', 'chef']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const staffController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const staff = await staffService.getAll(req.tenantId!);
      return sendSuccess(res, staff);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const body = createSchema.parse(req.body);
      const staff = await staffService.create(req.tenantId!, body);
      return sendSuccess(res, staff, 'کارمند اضافه شد', 201);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const body = updateSchema.parse(req.body);
      const staff = await staffService.update(req.params.id as string, req.tenantId!, body);
      return sendSuccess(res, staff, 'کارمند بروز شد');
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      await staffService.remove(req.params.id as string, req.tenantId!);
      return sendSuccess(res, null, 'کارمند حذف شد');
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },
};