import { Response } from "express";
import { cashierService } from "./cashier.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthRequest } from "../../types";

export const cashierController = {
  async getActiveTables(req: AuthRequest, res: Response) {
    try {
      const tables = await cashierService.getActiveTables(req.tenantId!);
      return sendSuccess(res, tables);
    } catch (e: any) {
      console.error("====== CASHIER ERROR ======");
      console.error(e);
      console.error(e.stack);

      return sendError(res, e.message);
    }
  },

  async payTable(req, res) {
    const tableNumber = Number(req.params.tableNumber);

    const result = await cashierService.payTable(req.tenantId!, tableNumber);

    return sendSuccess(res, result);
  },

  async getTableDetail(req: AuthRequest, res: Response) {
    try {
      const tableNumber = parseInt(req.params.tableNumber as string);
      const detail = await cashierService.getTableDetail(
        req.tenantId!,
        tableNumber,
      );
      return sendSuccess(res, detail);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async closeTable(req: AuthRequest, res: Response) {
    try {
      const tableNumber = parseInt(req.params.tableNumber as string);
      const result = await cashierService.closeTable(
        req.tenantId!,
        tableNumber,
      );
      return sendSuccess(res, result, `میز ${tableNumber} بسته شد`);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },
};
