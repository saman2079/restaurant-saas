"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffController = void 0;
const staff_service_1 = require("./staff.service");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
    email: zod_1.z.string().email('ایمیل نامعتبر'),
    password: zod_1.z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
    role: zod_1.z.enum(['manager', 'waiter', 'chef']),
});
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    role: zod_1.z.enum(['manager', 'waiter', 'chef']).optional(),
    isActive: zod_1.z.boolean().optional(),
    password: zod_1.z.string().min(6).optional(),
});
exports.staffController = {
    async getAll(req, res) {
        try {
            const staff = await staff_service_1.staffService.getAll(req.tenantId);
            return (0, response_1.sendSuccess)(res, staff);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async create(req, res) {
        try {
            const body = createSchema.parse(req.body);
            const staff = await staff_service_1.staffService.create(req.tenantId, body);
            return (0, response_1.sendSuccess)(res, staff, 'کارمند اضافه شد', 201);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async update(req, res) {
        try {
            const body = updateSchema.parse(req.body);
            const staff = await staff_service_1.staffService.update(req.params.id, req.tenantId, body);
            return (0, response_1.sendSuccess)(res, staff, 'کارمند بروز شد');
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async remove(req, res) {
        try {
            await staff_service_1.staffService.remove(req.params.id, req.tenantId);
            return (0, response_1.sendSuccess)(res, null, 'کارمند حذف شد');
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
};
//# sourceMappingURL=staff.controller.js.map