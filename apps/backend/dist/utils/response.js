"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'موفق', statusCode = 200, pagination) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(pagination && { pagination }),
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 400, error) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && error && { error: error.message }),
    });
};
exports.sendError = sendError;
//# sourceMappingURL=response.js.map