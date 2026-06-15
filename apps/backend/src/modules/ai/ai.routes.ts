import { Router } from "express";
import { Response } from "express";
import { aiService } from "./ai.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthRequest } from "../../types";
import { resolveTenant } from "../../middlewares/tenant.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireManager } from "../../middlewares/role.middleware";

const router = Router({ mergeParams: true });

// چت مشتری (بدون auth)
router.post("/chat", resolveTenant, async (req: AuthRequest, res: Response) => {
  try {
    const { message, sessionId, tableNumber } = req.body;
    if (!message || !sessionId)
      return sendError(res, "پیام و sessionId لازم است");

    const result = await aiService.chat(
      req.tenantId!,
      sessionId,
      message,
      tableNumber,
    );
    return sendSuccess(res, result);
  } catch (e: any) {
    return sendError(res, e.message);
  }
});

// تحلیل برای ادمین
router.post(
  "/analyze",
  authenticate,
  resolveTenant,
  requireManager,
  async (req: AuthRequest, res: Response) => {
    try {
      const { question } = req.body;
      const result = await aiService.analyzeForAdmin(req.tenantId!, question);
      return sendSuccess(res, { answer: result });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  },
);

export default router;
