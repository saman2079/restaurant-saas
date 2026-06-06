"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
// مشتری میتونه سفارش بده (بدون احراز هویت)
router.post('/', tenant_middleware_1.resolveTenant, order_controller_1.orderController.create);
// کارمندان
router.use(auth_middleware_1.authenticate, tenant_middleware_1.resolveTenant, role_middleware_1.requireStaff);
router.get('/', order_controller_1.orderController.getAll);
router.get('/:id', order_controller_1.orderController.getById);
router.patch('/:id/status', order_controller_1.orderController.updateStatus);
exports.default = router;
//# sourceMappingURL=order.routes.js.map