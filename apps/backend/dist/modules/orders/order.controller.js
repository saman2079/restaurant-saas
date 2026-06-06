"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const order_service_1 = require("./order.service");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const createOrderSchema = zod_1.z.object({
    tableNumber: zod_1.z.number().optional(),
    tableId: zod_1.z.string().uuid().optional(),
    customerName: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    isAiOrder: zod_1.z.boolean().optional(),
    items: zod_1.z.array(zod_1.z.object({
        menuItemId: zod_1.z.string().uuid(),
        quantity: zod_1.z.number().positive().int(),
        notes: zod_1.z.string().optional(),
    })).min(1, 'حداقل یک آیتم لازم است'),
});
exports.orderController = {
    async create(req, res) {
        try {
            const body = createOrderSchema.parse(req.body);
            const order = await order_service_1.orderService.create(req.tenantId, body);
            return (0, response_1.sendSuccess)(res, order, 'سفارش ثبت شد', 201);
        }
        catch (error) {
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
            const { status } = req.body;
            const order = await order_service_1.orderService.updateStatus(String(req.params.id), req.tenantId, status, req.user.userId);
            return (0, response_1.sendSuccess)(res, order, 'وضعیت سفارش بروز شد');
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
};
//# sourceMappingURL=order.controller.js.map