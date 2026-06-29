"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const order_service_1 = require("./order.service");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const createOrderSchema = zod_1.z.object({
    tableNumber: zod_1.z
        .number({ required_error: "شماره میز الزامی است" })
        .int()
        .positive("شماره میز معتبر نیست"),
    sessionToken: zod_1.z.string({ required_error: "session token الزامی است" }),
    tableId: zod_1.z.string().uuid().optional(),
    customerName: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    isAiOrder: zod_1.z.boolean().optional(),
    items: zod_1.z
        .array(zod_1.z.object({
        menuItemId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive().int(),
        notes: zod_1.z.string().optional(),
    }))
        .min(1, "حداقل یک آیتم لازم است"),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
        "awaiting_payment",
    ]),
    rejectionReason: zod_1.z.string().optional(),
});
const updateItemsSchema = zod_1.z.object({
    items: zod_1.z
        .array(zod_1.z.object({
        menuItemId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive().int(),
        notes: zod_1.z.string().optional(),
    }))
        .min(1),
});
// schema برای ویرایش توسط مشتری
const customerUpdateSchema = zod_1.z.object({
    tableNumber: zod_1.z.number(),
    sessionToken: zod_1.z.string(),
    items: zod_1.z
        .array(zod_1.z.object({
        menuItemId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive().int(),
        notes: zod_1.z.string().optional(),
    }))
        .min(1),
});
exports.orderController = {
    async create(req, res) {
        try {
            const body = createOrderSchema.parse(req.body);
            const order = await order_service_1.orderService.create(req.tenantId, body);
            return (0, response_1.sendSuccess)(res, order, "سفارش ثبت شد", 201);
        }
        catch (error) {
            if (error.name === "ZodError")
                return (0, response_1.sendError)(res, "اطلاعات ناقص است", 400);
            return (0, response_1.sendError)(res, error.message);
        }
    },
    // ─── سفارش فعال میز (برای مشتری - نیاز به session) ───
    async getActiveByTable(req, res) {
        try {
            const tableNumber = parseInt(req.query.tableNumber);
            const sessionToken = req.query.sessionToken;
            if (!tableNumber || !sessionToken) {
                return (0, response_1.sendError)(res, "tableNumber و sessionToken الزامی است", 400);
            }
            const order = await order_service_1.orderService.getActiveByTable(req.tenantId, tableNumber, sessionToken);
            return (0, response_1.sendSuccess)(res, order);
        }
        catch (error) {
            if (error.message === "SESSION_INVALID")
                return (0, response_1.sendError)(res, "جلسه منقضی شده", 401);
            return (0, response_1.sendError)(res, error.message);
        }
    },
    // ─── ویرایش سفارش توسط مشتری ───
    async updateByCustomer(req, res) {
        try {
            const body = customerUpdateSchema.parse(req.body);
            const order = await order_service_1.orderService.updateItemsByCustomer(req.params.id, req.tenantId, body.tableNumber, body.sessionToken, body.items);
            return (0, response_1.sendSuccess)(res, order, "سفارش بروز شد");
        }
        catch (error) {
            if (error.message === "SESSION_INVALID")
                return (0, response_1.sendError)(res, "جلسه منقضی شده", 401);
            if (error.message?.startsWith("EDIT_RESTRICTED"))
                return (0, response_1.sendError)(res, "بعد از تایید آشپز فقط می‌توانید آیتم جدید اضافه کنید", 403);
            if (error.message?.startsWith("EDIT_NOT_ALLOWED"))
                return (0, response_1.sendError)(res, "سفارش قابل ویرایش نیست", 403);
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async getAll(req, res) {
        try {
            const orders = await order_service_1.orderService.getAll(req.tenantId, {
                status: req.query.status,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 20,
            });
            return (0, response_1.sendSuccess)(res, orders);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async getById(req, res) {
        try {
            const order = await order_service_1.orderService.getById(String(req.params.id), req.tenantId);
            return (0, response_1.sendSuccess)(res, order);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message, 404);
        }
    },
    async updateStatus(req, res) {
        try {
            const body = updateStatusSchema.parse(req.body);
            const order = await order_service_1.orderService.updateStatus(req.params.id, req.tenantId, body.status, req.user.userId, body.rejectionReason);
            return (0, response_1.sendSuccess)(res, order, "وضعیت سفارش بروز شد");
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async updateItems(req, res) {
        try {
            const body = updateItemsSchema.parse(req.body);
            const order = await order_service_1.orderService.updateItems(req.params.id, req.tenantId, body.items);
            return (0, response_1.sendSuccess)(res, order, "سفارش بروز شد");
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async getByIdPublic(req, res) {
        try {
            const order = await order_service_1.orderService.getById(req.params.id, req.tenantId);
            return (0, response_1.sendSuccess)(res, order);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message, 404);
        }
    },
};
//# sourceMappingURL=order.controller.js.map