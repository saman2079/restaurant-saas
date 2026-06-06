"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateOptional = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const redis_1 = require("../config/redis");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return (0, response_1.sendError)(res, 'توکن ارائه نشده', 401);
        }
        const token = authHeader.split(' ')[1];
        // چک کن توکن blacklist نشده
        const isBlacklisted = await redis_1.redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return (0, response_1.sendError)(res, 'توکن منقضی شده', 401);
        }
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return (0, response_1.sendError)(res, 'توکن نامعتبر', 401);
    }
};
exports.authenticate = authenticate;
const authenticateOptional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = (0, jwt_1.verifyToken)(token);
            req.user = payload;
        }
        next();
    }
    catch {
        next();
    }
};
exports.authenticateOptional = authenticateOptional;
//# sourceMappingURL=auth.middleware.js.map