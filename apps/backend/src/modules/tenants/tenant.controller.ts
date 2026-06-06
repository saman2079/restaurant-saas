import { Request, Response } from 'express';
import { tenantService } from './tenant.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../types';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
  plan: z.enum(['basic', 'pro', 'business']).optional(),
});

export const tenantController = {
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      
      const { tenants, total } = await tenantService.getAll(page, limit, search);
      return sendSuccess(res, tenants, 'موفق', 200, {
        page, limit, total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async getBySlug(req: Request, res: Response) {
    try {
      const tenant = await tenantService.getBySlug(String(req.params.slug));
      return sendSuccess(res, tenant);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  },
  
  async create(req: Request, res: Response) {
    try {
      const body = createTenantSchema.parse(req.body);
      const result = await tenantService.create(body);
      return sendSuccess(res, result, 'رستوران با موفقیت ایجاد شد', 201);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async update(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.role === 'super_admin'
        ? req.params.id
        : req.user?.tenantId!;
      
      const updated = await tenantService.update(String(tenantId), req.body);
      return sendSuccess(res, updated, 'بروزرسانی موفق');
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async toggleActive(req: Request, res: Response) {
    try {
      const updated = await tenantService.toggleActive(String(req.params.id));
      return sendSuccess(res, updated);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
};