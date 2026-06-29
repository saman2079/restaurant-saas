"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTenantAccess = void 0;
const response_1 = require("../utils/response");
const validateTenantAccess = (req, res, next) => {
    if (!req.user) {
        return (0, response_1.sendError)(res, "Unauthorized", 401);
    }
    // سوپر ادمین همه جا دسترسی داره
    if (req.user.role === "super_admin") {
        return next();
    }
    if (req.user.tenantId !== req.tenantId) {
        return (0, response_1.sendError)(res, "شما به این رستوران دسترسی ندارید", 403);
    }
    next();
};
exports.validateTenantAccess = validateTenantAccess;
//# sourceMappingURL=tenant-access.middleware.js.map