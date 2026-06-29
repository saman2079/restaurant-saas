"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
// --- بخش مشتری (نیاز به auth کارمندی ندارد) ---
router.post('/', tenant_middleware_1.resolveTenant, order_controller_1.orderController.create);
router.get('/public/:id', tenant_middleware_1.resolveTenant, order_controller_1.orderController.getByIdPublic);
// این دو خط جدید را اینجا اضافه کن:
router.get('/active-table', tenant_middleware_1.resolveTenant, order_controller_1.orderController.getActiveByTable);
router.patch('/:id/customer', tenant_middleware_1.resolveTenant, order_controller_1.orderController.updateByCustomer);
router.patch('/:id/items', tenant_middleware_1.resolveTenant, order_controller_1.orderController.updateItems);
// --- بخش کارمندان (نیاز به auth و سطح دسترسی دارند) ---
router.use(auth_middleware_1.authenticate, tenant_middleware_1.resolveTenant, role_middleware_1.requireStaff);
router.get('/', order_controller_1.orderController.getAll);
router.get('/:id', order_controller_1.orderController.getById);
router.patch('/:id/status', order_controller_1.orderController.updateStatus);
exports.default = router;
//# sourceMappingURL=order.routes.js.map