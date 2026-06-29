"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_controller_1 = require("./staff.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middleware_1.authenticate, tenant_middleware_1.resolveTenant);
router.get('/', role_middleware_1.requireManager, staff_controller_1.staffController.getAll);
router.post('/', role_middleware_1.requireOwner, staff_controller_1.staffController.create);
router.patch('/:id', role_middleware_1.requireOwner, staff_controller_1.staffController.update);
router.delete('/:id', role_middleware_1.requireOwner, staff_controller_1.staffController.remove);
exports.default = router;
//# sourceMappingURL=staff.routes.js.map