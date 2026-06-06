"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStaff = exports.requireManager = exports.requireOwner = exports.requireSuperAdmin = exports.requireRole = void 0;
const response_1 = require("../utils/response");
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return (0, response_1.sendError)(res, 'احراز هویت لازم است', 401);
        }
        if (!roles.includes(req.user.role)) {
            return (0, response_1.sendError)(res, 'دسترسی ندارید', 403);
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireSuperAdmin = (0, exports.requireRole)('super_admin');
exports.requireOwner = (0, exports.requireRole)('super_admin', 'owner');
exports.requireManager = (0, exports.requireRole)('super_admin', 'owner', 'manager');
exports.requireStaff = (0, exports.requireRole)('super_admin', 'owner', 'manager', 'waiter', 'chef');
//# sourceMappingURL=role.middleware.js.map