"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error("🔴 Error:", err);
    console.error("==============");
    console.error("NAME:", err.name);
    console.error("MESSAGE:", err.message);
    console.error("CAUSE:", err.cause);
    if (err.cause) {
        console.error("PG CODE:", err.cause.code);
        console.error("PG MESSAGE:", err.cause.message);
        console.error("PG DETAIL:", err.cause.detail);
        console.error("PG HINT:", err.cause.hint);
    }
    console.error("STACK:", err.stack);
    console.error("==============");
    if (err.name === "ValidationError") {
        return res.status(400).json({ success: false, message: err.message });
    }
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "توکن نامعتبر" });
    }
    return res.status(err.status || 500).json({
        success: false,
        message: err.message || "خطای سرور",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res
        .status(404)
        .json({ success: false, message: `مسیر ${req.path} پیدا نشد` });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map