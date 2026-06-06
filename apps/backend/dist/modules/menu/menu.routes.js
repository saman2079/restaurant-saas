"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menu_controller_1 = require("./menu.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
// ─── عمومی (مشتری) ────────────────────────────────────────
router.get('/full', tenant_middleware_1.resolveTenant, menu_controller_1.menuController.getFullMenu);
// ─── ادمین ────────────────────────────────────────────────
router.use(auth_middleware_1.authenticate, tenant_middleware_1.resolveTenant);
// دسته‌بندی
router.get('/categories', menu_controller_1.menuController.getCategories);
router.post('/categories', role_middleware_1.requireManager, menu_controller_1.menuController.createCategory);
router.patch('/categories/:id', role_middleware_1.requireManager, menu_controller_1.menuController.updateCategory);
router.delete('/categories/:id', role_middleware_1.requireManager, menu_controller_1.menuController.deleteCategory);
// آیتم‌ها
router.get('/items', menu_controller_1.menuController.getItems);
router.post('/items', role_middleware_1.requireManager, menu_controller_1.menuController.createItem);
router.patch('/items/:id', role_middleware_1.requireManager, menu_controller_1.menuController.updateItem);
router.delete('/items/:id', role_middleware_1.requireManager, menu_controller_1.menuController.deleteItem);
exports.default = router;
//# sourceMappingURL=menu.routes.js.map