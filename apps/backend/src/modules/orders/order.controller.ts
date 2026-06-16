import { Response } from "express";
import { orderService } from "./order.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthRequest } from "../../types";
import { z } from "zod";

const createOrderSchema = z.object({
  tableNumber: z.number().optional(),
  tableId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
  isAiOrder: z.boolean().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().positive().int(),
        notes: z.string().optional(),
      }),
    )
    .min(1, "حداقل یک آیتم لازم است"),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ]),
  rejectionReason: z.string().optional(),
});

const updateItemsSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().positive().int(),
        notes: z.string().optional(),
      }),
    )
    .min(1),
});

export const orderController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const body = createOrderSchema.parse(req.body);
      const order = await orderService.create(req.tenantId!, body);
      return sendSuccess(res, order, "سفارش ثبت شد", 201);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      const orders = await orderService.getAll(req.tenantId!, {
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      return sendSuccess(res, orders);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.getById(
        String(req.params.id),
        req.tenantId!,
      );
      return sendSuccess(res, order);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  },

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const body = updateStatusSchema.parse(req.body);
      const order = await orderService.updateStatus(
        req.params.id as string,
        req.tenantId!,
        body.status,
        req.user!.userId,
        body.rejectionReason,
      );
      return sendSuccess(res, order, "وضعیت سفارش بروز شد");
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },

  async updateItems(req: AuthRequest, res: Response) {
    try {
      const body = updateItemsSchema.parse(req.body);
      const order = await orderService.updateItems(
        req.params.id as string,
        req.tenantId!,
        body.items,
      );
      return sendSuccess(res, order, "سفارش بروز شد");
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },

  async getByIdPublic(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.getById(req.params.id as string, req.tenantId!);
      return sendSuccess(res, order);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  },
};
