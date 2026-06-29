"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_service_1 = require("./ai.service");
const response_1 = require("../../utils/response");
const tenant_middleware_1 = require("../../middlewares/tenant.middleware");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)({ mergeParams: true });
// چت مشتری (بدون auth)
router.post("/chat", tenant_middleware_1.resolveTenant, async (req, res) => {
    try {
        const { message, sessionId, tableNumber, sessionToken } = req.body;
        if (!message || !sessionId)
            return (0, response_1.sendError)(res, "پیام و sessionId لازم است");
        const result = await ai_service_1.aiService.chat(req.tenantId, sessionId, message, tableNumber, sessionToken);
        return (0, response_1.sendSuccess)(res, result);
    }
    catch (e) {
        return (0, response_1.sendError)(res, e.message);
    }
});
// تحلیل برای ادمین
router.post("/analyze", auth_middleware_1.authenticate, tenant_middleware_1.resolveTenant, role_middleware_1.requireManager, async (req, res) => {
    try {
        const { question } = req.body;
        const result = await ai_service_1.aiService.analyzeForAdmin(req.tenantId, question);
        return (0, response_1.sendSuccess)(res, { answer: result });
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=ai.routes.js.map