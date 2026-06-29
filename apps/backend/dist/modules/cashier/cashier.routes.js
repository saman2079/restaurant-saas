"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cashier_controller_1 = require("./cashier.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middleware_1.authenticate, tenant_middleware_1.resolveTenant);
router.get("/tables", cashier_controller_1.cashierController.getActiveTables);
router.get("/tables/:tableNumber", cashier_controller_1.cashierController.getTableDetail);
router.post("/tables/:tableNumber/close", cashier_controller_1.cashierController.closeTable);
router.post("/tables/:tableNumber/pay", cashier_controller_1.cashierController.payTable);
exports.default = router;
//# sourceMappingURL=cashier.routes.js.map