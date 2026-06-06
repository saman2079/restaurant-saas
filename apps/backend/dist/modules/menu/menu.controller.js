"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuController = void 0;
const menu_service_1 = require("./menu.service");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const createItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    nameEn: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive(),
    categoryId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.enum(['available', 'unavailable', 'out_of_stock']).optional(),
    isPopular: zod_1.z.boolean().optional(),
    isFeatured: zod_1.z.boolean().optional(),
    preparationTime: zod_1.z.number().optional(),
    calories: zod_1.z.number().optional(),
    allergens: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    sortOrder: zod_1.z.number().optional(),
});
exports.menuController = {
    // عمومی - برای مشتری
    async getFullMenu(req, res) {
        try {
            const tenantId = req.tenantId;
            const menu = await menu_service_1.menuService.getFullMenu(tenantId);
            return (0, response_1.sendSuccess)(res, menu);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    // ادمین
    async getCategories(req, res) {
        try {
            const cats = await menu_service_1.menuService.getCategories(req.tenantId);
            return (0, response_1.sendSuccess)(res, cats);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async createCategory(req, res) {
        try {
            const cat = await menu_service_1.menuService.createCategory(req.tenantId, req.body);
            return (0, response_1.sendSuccess)(res, cat, 'دسته‌بندی ایجاد شد', 201);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async updateCategory(req, res) {
        try {
            const cat = await menu_service_1.menuService.updateCategory(String(req.params.id), req.tenantId, req.body);
            return (0, response_1.sendSuccess)(res, cat);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async deleteCategory(req, res) {
        try {
            await menu_service_1.menuService.deleteCategory(String(req.params.id), req.tenantId);
            return (0, response_1.sendSuccess)(res, null, 'دسته‌بندی حذف شد');
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async getItems(req, res) {
        try {
            const items = await menu_service_1.menuService.getItems(req.tenantId, {
                categoryId: req.query.categoryId,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 50,
            });
            return (0, response_1.sendSuccess)(res, items);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async createItem(req, res) {
        try {
            const body = createItemSchema.parse(req.body);
            const item = await menu_service_1.menuService.createItem(req.tenantId, body);
            return (0, response_1.sendSuccess)(res, item, 'آیتم ایجاد شد', 201);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async updateItem(req, res) {
        try {
            const item = await menu_service_1.menuService.updateItem(String(req.params.id), req.tenantId, req.body);
            return (0, response_1.sendSuccess)(res, item);
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
    async deleteItem(req, res) {
        try {
            await menu_service_1.menuService.deleteItem(String(req.params.id), req.tenantId);
            return (0, response_1.sendSuccess)(res, null, 'آیتم حذف شد');
        }
        catch (error) {
            return (0, response_1.sendError)(res, error.message);
        }
    },
};
//# sourceMappingURL=menu.controller.js.map