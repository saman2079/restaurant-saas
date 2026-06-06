import { Response } from 'express';
import { menuService } from './menu.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../types';
import { z } from 'zod';

const createItemSchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['available', 'unavailable', 'out_of_stock']).optional(),
  isPopular: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  preparationTime: z.number().optional(),
  calories: z.number().optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
});

export const menuController = {
  // عمومی - برای مشتری
  async getFullMenu(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const menu = await menuService.getFullMenu(tenantId);
      return sendSuccess(res, menu);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  // ادمین
  async getCategories(req: AuthRequest, res: Response) {
    try {
      const cats = await menuService.getCategories(req.tenantId!);
      return sendSuccess(res, cats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async createCategory(req: AuthRequest, res: Response) {
    try {
      const cat = await menuService.createCategory(req.tenantId!, req.body);
      return sendSuccess(res, cat, 'دسته‌بندی ایجاد شد', 201);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const cat = await menuService.updateCategory(String(req.params.id), req.tenantId!, req.body);
      return sendSuccess(res, cat);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      await menuService.deleteCategory(String(req.params.id), req.tenantId!);
      return sendSuccess(res, null, 'دسته‌بندی حذف شد');
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async getItems(req: AuthRequest, res: Response) {
    try {
      const items = await menuService.getItems(req.tenantId!, {
        categoryId: req.query.categoryId as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      });
      return sendSuccess(res, items);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async createItem(req: AuthRequest, res: Response) {
    try {
      const body = createItemSchema.parse(req.body);
      const item = await menuService.createItem(req.tenantId!, body);
      return sendSuccess(res, item, 'آیتم ایجاد شد', 201);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async updateItem(req: AuthRequest, res: Response) {
    try {
      const item = await menuService.updateItem(String(req.params.id), req.tenantId!, req.body);
      return sendSuccess(res, item);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
  
  async deleteItem(req: AuthRequest, res: Response) {
    try {
      await menuService.deleteItem(String(req.params.id), req.tenantId!);
      return sendSuccess(res, null, 'آیتم حذف شد');
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
};