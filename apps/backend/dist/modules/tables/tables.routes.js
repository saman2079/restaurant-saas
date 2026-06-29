"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tables_service_1 = require("./tables.service");
const response_1 = require("../../utils/response");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
router.post('/session', tenant_middleware_1.resolveTenant, async (req, res) => {
    try {
        const { tableNumber } = req.body;
        if (!tableNumber)
            return (0, response_1.sendError)(res, 'شماره میز لازم است');
        const result = await tables_service_1.tablesService.startSession(req.tenantId, parseInt(tableNumber));
        return (0, response_1.sendSuccess)(res, result);
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message, 403);
    }
});
exports.default = router;
//# sourceMappingURL=tables.routes.js.map