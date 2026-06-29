"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTenant = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const schema_1 = require("../db/schema");
const response_1 = require("../utils/response");
const resolveTenant = async (req, res, next) => {
    const slug = typeof req.params.slug === 'string'
        ? req.params.slug
        : typeof req.headers['x-tenant-slug'] === 'string'
            ? req.headers['x-tenant-slug']
            : undefined;
    if (!slug) {
        return (0, response_1.sendError)(res, 'رستوران مشخص نشده', 400);
    }
    let tenant = null;
    // ==========================
    // Redis Cache
    // ==========================
    const cached = await redis_1.redis.get(`tenant:${slug}`);
    if (cached) {
        tenant = JSON.parse(cached);
    }
    else {
        const [dbTenant] = await database_1.db
            .select()
            .from(schema_1.tenants)
            .where((0, drizzle_orm_1.eq)(schema_1.tenants.slug, slug));
        if (!dbTenant || !dbTenant.isActive) {
            return (0, response_1.sendError)(res, 'رستوران پیدا نشد', 404);
        }
        tenant = dbTenant;
        // Cache for 5 minutes
        await redis_1.redis.setex(`tenant:${slug}`, 300, JSON.stringify(tenant));
    }
    // ==========================
    // Security Check
    // ==========================
    if (req.user && req.user.role !== 'super_admin') {
        if (req.user.tenantId !== tenant.id) {
            return (0, response_1.sendError)(res, 'دسترسی غیرمجاز', 403);
        }
    }
    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
};
exports.resolveTenant = resolveTenant;
//# sourceMappingURL=tenant.middleware.js.map