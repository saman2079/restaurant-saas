"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTenant = void 0;
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../utils/response");
const redis_1 = require("../config/redis");
const resolveTenant = async (req, res, next) => {
    const slug = typeof req.params.slug === 'string'
        ? req.params.slug
        : typeof req.headers['x-tenant-slug'] === 'string'
            ? req.headers['x-tenant-slug']
            : undefined;
    if (!slug) {
        return (0, response_1.sendError)(res, 'رستوران مشخص نشده', 400);
    }
    // اول از Redis چک کن
    const cached = await redis_1.redis.get(`tenant:${slug}`);
    if (cached) {
        req.tenant = JSON.parse(cached);
        req.tenantId = req.tenant.id;
        return next();
    }
    const [tenant] = await database_1.db.select().from(schema_1.tenants).where((0, drizzle_orm_1.eq)(schema_1.tenants.slug, slug));
    if (!tenant || !tenant.isActive) {
        return (0, response_1.sendError)(res, 'رستوران پیدا نشد', 404);
    }
    // کش کن برای ۵ دقیقه
    await redis_1.redis.setex(`tenant:${slug}`, 300, JSON.stringify(tenant));
    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
};
exports.resolveTenant = resolveTenant;
//# sourceMappingURL=tenant.middleware.js.map