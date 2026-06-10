"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const hash_1 = require("../../utils/hash");
const jwt_1 = require("../../utils/jwt");
const redis_1 = require("../../config/redis");
const env_1 = require("../../config/env");
exports.authService = {
    async login(email, password) {
        const [user] = await database_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (!user || !user.isActive) {
            throw new Error('ایمیل یا رمز عبور اشتباه است');
        }
        const isValid = await (0, hash_1.comparePassword)(password, user.password);
        if (!isValid) {
            throw new Error('ایمیل یا رمز عبور اشتباه است');
        }
        await database_1.db.update(schema_1.users)
            .set({ lastLoginAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        let tenantSlug = null;
        if (user.tenantId) {
            const [tenant] = await database_1.db
                .select({ slug: schema_1.tenants.slug })
                .from(schema_1.tenants)
                .where((0, drizzle_orm_1.eq)(schema_1.tenants.id, user.tenantId));
            tenantSlug = tenant?.slug ?? null;
        }
        const token = (0, jwt_1.signToken)({
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            email: user.email,
        });
        const { password: _, ...userWithoutPassword } = user;
        return { token, user: { ...userWithoutPassword, tenantSlug } };
    },
    async logout(token) {
        await redis_1.redis.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, '1');
    },
    async getMe(userId) {
        const [user] = await database_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        if (!user)
            throw new Error('کاربر پیدا نشد');
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },
    async createSuperAdmin() {
        const existing = await database_1.db.select().from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, env_1.env.SUPER_ADMIN_EMAIL));
        if (existing.length > 0)
            return;
        const hashed = await (0, hash_1.hashPassword)(env_1.env.SUPER_ADMIN_PASSWORD);
        await database_1.db.insert(schema_1.users).values({
            name: 'Super Admin',
            email: env_1.env.SUPER_ADMIN_EMAIL,
            password: hashed,
            role: 'super_admin',
            tenantId: null,
        });
        console.log('✅ Super Admin ساخته شد');
    },
};
//# sourceMappingURL=auth.service.js.map