"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffService = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const hash_1 = require("../../utils/hash");
exports.staffService = {
    async getAll(tenantId) {
        const result = await database_1.db.select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            role: schema_1.users.role,
            isActive: schema_1.users.isActive,
            avatar: schema_1.users.avatar,
            lastLoginAt: schema_1.users.lastLoginAt,
            createdAt: schema_1.users.createdAt,
        }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.tenantId, tenantId));
        return result;
    },
    async create(tenantId, data) {
        const existing = await database_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, data.email));
        if (existing.length > 0)
            throw new Error('این ایمیل قبلاً ثبت شده');
        const hashed = await (0, hash_1.hashPassword)(data.password);
        const [user] = await database_1.db.insert(schema_1.users).values({
            tenantId,
            name: data.name,
            email: data.email,
            password: hashed,
            role: data.role,
        }).returning();
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },
    async update(id, tenantId, data) {
        const [updated] = await database_1.db.update(schema_1.users)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.tenantId, tenantId)))
            .returning();
        const { password: _, ...userWithoutPassword } = updated;
        return userWithoutPassword;
    },
    async delete(id, tenantId) {
        await database_1.db.delete(schema_1.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, id), (0, drizzle_orm_1.eq)(schema_1.users.tenantId, tenantId)));
    },
};
//# sourceMappingURL=staff.service.js.map