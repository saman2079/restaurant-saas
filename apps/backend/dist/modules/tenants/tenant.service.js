"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantService = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const slugify_1 = __importDefault(require("slugify"));
const hash_1 = require("../../utils/hash");
const redis_1 = require("../../config/redis");
exports.tenantService = {
    async getAll(page = 1, limit = 20, search) {
        const offset = (page - 1) * limit;
        let query = database_1.db.select().from(schema_1.tenants);
        if (search) {
            query = query.where((0, drizzle_orm_1.ilike)(schema_1.tenants.name, `%${search}%`));
        }
        const [allTenants, totalResult] = await Promise.all([
            query.limit(limit).offset(offset),
            database_1.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.tenants),
        ]);
        return { tenants: allTenants, total: totalResult[0].count };
    },
    async getBySlug(slug) {
        const [tenant] = await database_1.db.select().from(schema_1.tenants).where((0, drizzle_orm_1.eq)(schema_1.tenants.slug, slug));
        if (!tenant)
            throw new Error('رستوران پیدا نشد');
        return tenant;
    },
    async create(data) {
        const slug = (0, slugify_1.default)(data.name, { lower: true, strict: true, locale: 'en' });
        // چک slug تکراری
        const existing = await database_1.db.select().from(schema_1.tenants).where((0, drizzle_orm_1.eq)(schema_1.tenants.slug, slug));
        if (existing.length > 0) {
            throw new Error('این نام قبلاً ثبت شده است');
        }
        // ایجاد رستوران
        const [tenant] = await database_1.db.insert(schema_1.tenants).values({
            name: data.name,
            slug,
            plan: data.plan || 'basic',
        }).returning();
        // ایجاد owner
        const hashedPassword = await (0, hash_1.hashPassword)(data.ownerPassword);
        const [owner] = await database_1.db.insert(schema_1.users).values({
            tenantId: tenant.id,
            name: data.ownerName,
            email: data.ownerEmail,
            password: hashedPassword,
            role: 'owner',
        }).returning();
        const { password: _, ...ownerWithoutPassword } = owner;
        return { tenant, owner: ownerWithoutPassword };
    },
    async update(id, data) {
        // کش رو پاک کن
        const [existing] = await database_1.db.select().from(schema_1.tenants).where((0, drizzle_orm_1.eq)(schema_1.tenants.id, id));
        if (existing) {
            await redis_1.redis.del(`tenant:${existing.slug}`);
        }
        const [updated] = await database_1.db.update(schema_1.tenants)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.tenants.id, id))
            .returning();
        return updated;
    },
    async toggleActive(id) {
        const [tenant] = await database_1.db.select().from(schema_1.tenants).where((0, drizzle_orm_1.eq)(schema_1.tenants.id, id));
        if (!tenant)
            throw new Error('رستوران پیدا نشد');
        await redis_1.redis.del(`tenant:${tenant.slug}`);
        const [updated] = await database_1.db.update(schema_1.tenants)
            .set({ isActive: !tenant.isActive, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.tenants.id, id))
            .returning();
        return updated;
    },
};
//# sourceMappingURL=tenant.service.js.map