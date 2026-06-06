"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantController = void 0;
const tenant_service_1 = require("./tenant.service");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const createTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
    ownerName: zod_1.z.string().min(2),
    ownerEmail: zod_1.z.string().email(),
    ownerPassword: zod_1.z.string().min(8),
    plan: zod_1.z.enum(['basic', 'pro', 'business']).optional(),
});
exports.tenantController = {
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search;
            const { tenants, total } = await tenant_service_1.tenantService.getAll(page, limit, search);
            return (0, response_1.sendSuccess)(res, tenants, 'موفق', 200, {
                page, limit, total: Number(total),
                totalPages: Math.ceil(Number(total) / limit),
            });
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async getBySlug(req, res) {
        try {
            const tenant = await tenant_service_1.tenantService.getBySlug(String(req.params.slug));
            return (0, response_1.sendSuccess)(res, tenant);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message, 404);
        }
    },
    async create(req, res) {
        try {
            const body = createTenantSchema.parse(req.body);
            const result = await tenant_service_1.tenantService.create(body);
            return (0, response_1.sendSuccess)(res, result, 'رستوران با موفقیت ایجاد شد', 201);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async update(req, res) {
        try {
            const tenantId = req.user?.role === 'super_admin'
                ? req.params.id
                : req.user?.tenantId;
            const updated = await tenant_service_1.tenantService.update(String(tenantId), req.body);
            return (0, response_1.sendSuccess)(res, updated, 'بروزرسانی موفق');
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async toggleActive(req, res) {
        try {
            const updated = await tenant_service_1.tenantService.toggleActive(String(req.params.id));
            return (0, response_1.sendSuccess)(res, updated);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
};
//# sourceMappingURL=tenant.controller.js.map