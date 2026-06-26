import { Router } from "express";
import { cashierController } from "./cashier.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { resolveTenant } from "../../middlewares/tenant.middleware";

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

router.get("/tables", cashierController.getActiveTables);
router.get("/tables/:tableNumber", cashierController.getTableDetail);
router.post("/tables/:tableNumber/close", cashierController.closeTable);
router.post("/tables/:tableNumber/pay", cashierController.payTable);

export default router;
