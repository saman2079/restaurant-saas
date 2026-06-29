"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_middleware_1.authenticate, tenant_middleware_1.resolveTenant, role_middleware_1.requireManager);
router.get('/summary', analytics_controller_1.analyticsController.getSummary);
router.get('/top-items', analytics_controller_1.analyticsController.getTopItems);
router.get('/daily', analytics_controller_1.analyticsController.getDailyRevenue);
router.get('/hourly', analytics_controller_1.analyticsController.getHourlyDistribution);
router.post('/ai-insight', analytics_controller_1.analyticsController.getAiInsight);
exports.default = router;
//# sourceMappingURL=analytics.routes.js.map