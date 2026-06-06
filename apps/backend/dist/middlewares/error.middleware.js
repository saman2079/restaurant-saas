"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('🔴 Error:', err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'توکن نامعتبر' });
    }
    return res.status(err.status || 500).json({
        success: false,
        message: err.message || 'خطای سرور',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({ success: false, message: `مسیر ${req.path} پیدا نشد` });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map