"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenant_controller_1 = require("./tenant.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
// سوپر ادمین
router.get('/', auth_middleware_1.authenticate, role_middleware_1.requireSuperAdmin, tenant_controller_1.tenantController.getAll);
router.post('/', auth_middleware_1.authenticate, role_middleware_1.requireSuperAdmin, tenant_controller_1.tenantController.create);
router.patch('/:id/toggle', auth_middleware_1.authenticate, role_middleware_1.requireSuperAdmin, tenant_controller_1.tenantController.toggleActive);
// عمومی (برای لود اطلاعات رستوران)
router.get('/:slug', tenant_controller_1.tenantController.getBySlug);
// owner خودش میتونه پروفایل رستورانشو آپدیت کنه
router.patch('/:id', auth_middleware_1.authenticate, role_middleware_1.requireOwner, tenant_controller_1.tenantController.update);
exports.default = router;
//# sourceMappingURL=tenant.routes.js.map