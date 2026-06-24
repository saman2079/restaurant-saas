import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { sendError } from "../utils/response";

export const validateTenantAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return sendError(res, "Unauthorized", 401);
  }

  // سوپر ادمین همه جا دسترسی داره
  if (req.user.role === "super_admin") {
    return next();
  }

  if (req.user.tenantId !== req.tenantId) {
    return sendError(
      res,
      "شما به این رستوران دسترسی ندارید",
      403
    );
  }

  next();
};