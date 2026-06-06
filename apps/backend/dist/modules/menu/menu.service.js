"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuService = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const redis_1 = require("../../config/redis");
exports.menuService = {
    // ─── Categories ───────────────────────────────────────
    async getCategories(tenantId) {
        const cacheKey = `menu:categories:${tenantId}`;
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const result = await database_1.db.select().from(schema_1.categories)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.categories.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.categories.isActive, true)))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.categories.sortOrder));
        await redis_1.redis.setex(cacheKey, 300, JSON.stringify(result));
        return result;
    },
    async createCategory(tenantId, data) {
        const [category] = await database_1.db.insert(schema_1.categories).values({ tenantId, ...data }).returning();
        await redis_1.redis.del(`menu:categories:${tenantId}`);
        return category;
    },
    async updateCategory(id, tenantId, data) {
        const [updated] = await database_1.db.update(schema_1.categories)
            .set(data)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.categories.id, id), (0, drizzle_orm_1.eq)(schema_1.categories.tenantId, tenantId)))
            .returning();
        await redis_1.redis.del(`menu:categories:${tenantId}`);
        return updated;
    },
    async deleteCategory(id, tenantId) {
        await database_1.db.delete(schema_1.categories)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.categories.id, id), (0, drizzle_orm_1.eq)(schema_1.categories.tenantId, tenantId)));
        await redis_1.redis.del(`menu:categories:${tenantId}`);
    },
    // ─── Menu Items ───────────────────────────────────────
    async getItems(tenantId, filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const offset = (page - 1) * limit;
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId)];
        if (filters?.categoryId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.menuItems.categoryId, filters.categoryId));
        }
        return await database_1.db
            .select()
            .from(schema_1.menuItems)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.menuItems.sortOrder), (0, drizzle_orm_1.asc)(schema_1.menuItems.name))
            .limit(limit)
            .offset(offset);
    },
    async getItemById(id, tenantId) {
        const [item] = await database_1.db.select().from(schema_1.menuItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.menuItems.id, id), (0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId)));
        if (!item)
            throw new Error('آیتم پیدا نشد');
        return item;
    },
    async createItem(tenantId, data) {
        const [item] = await database_1.db.insert(schema_1.menuItems)
            .values({ tenantId, ...data }).returning();
        await this.clearMenuCache(tenantId);
        return item;
    },
    async updateItem(id, tenantId, data) {
        const [updated] = await database_1.db.update(schema_1.menuItems)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.menuItems.id, id), (0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId)))
            .returning();
        await this.clearMenuCache(tenantId);
        return updated;
    },
    async deleteItem(id, tenantId) {
        await database_1.db.delete(schema_1.menuItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.menuItems.id, id), (0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId)));
        await this.clearMenuCache(tenantId);
    },
    async getFullMenu(tenantId) {
        const cacheKey = `menu:full:${tenantId}`;
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const [cats, items] = await Promise.all([
            database_1.db.select().from(schema_1.categories)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.categories.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.categories.isActive, true)))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.categories.sortOrder)),
            database_1.db.select().from(schema_1.menuItems)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.menuItems.status, 'available')))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.menuItems.sortOrder)),
        ]);
        const result = cats.map(cat => ({
            ...cat,
            items: items.filter(item => item.categoryId === cat.id),
        }));
        await redis_1.redis.setex(cacheKey, 300, JSON.stringify(result));
        return result;
    },
    async clearMenuCache(tenantId) {
        await redis_1.redis.del(`menu:full:${tenantId}`);
        await redis_1.redis.del(`menu:categories:${tenantId}`);
    },
};
//# sourceMappingURL=menu.service.js.map