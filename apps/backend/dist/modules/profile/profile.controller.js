"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileController = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const hash_1 = require("../../utils/hash");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const updateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    avatar: zod_1.z.string().optional(),
    currentPassword: zod_1.z.string().optional(),
    newPassword: zod_1.z.string().min(6).optional(),
});
exports.profileController = {
    async getMe(req, res) {
        try {
            const [user] = await database_1.db.select({
                id: schema_1.users.id,
                name: schema_1.users.name,
                email: schema_1.users.email,
                role: schema_1.users.role,
                avatar: schema_1.users.avatar,
                tenantId: schema_1.users.tenantId,
                createdAt: schema_1.users.createdAt,
            }).from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.userId));
            if (!user)
                return (0, response_1.sendError)(res, 'کاربر پیدا نشد', 404);
            return (0, response_1.sendSuccess)(res, user);
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
    async update(req, res) {
        try {
            const body = updateSchema.parse(req.body);
            const updateData = { updatedAt: new Date() };
            if (body.name)
                updateData.name = body.name;
            if (body.avatar)
                updateData.avatar = body.avatar;
            // تغییر رمز عبور
            if (body.newPassword) {
                if (!body.currentPassword) {
                    return (0, response_1.sendError)(res, 'رمز عبور فعلی را وارد کنید');
                }
                const [user] = await database_1.db.select().from(schema_1.users)
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.userId));
                const isValid = await (0, hash_1.comparePassword)(body.currentPassword, user.password);
                if (!isValid)
                    return (0, response_1.sendError)(res, 'رمز عبور فعلی اشتباه است');
                updateData.password = await (0, hash_1.hashPassword)(body.newPassword);
            }
            const [updated] = await database_1.db.update(schema_1.users)
                .set(updateData)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.user.userId))
                .returning({
                id: schema_1.users.id,
                name: schema_1.users.name,
                email: schema_1.users.email,
                role: schema_1.users.role,
                avatar: schema_1.users.avatar,
            });
            return (0, response_1.sendSuccess)(res, updated, 'پروفایل بروز شد');
        }
        catch (e) {
            return (0, response_1.sendError)(res, e.message);
        }
    },
};
//# sourceMappingURL=profile.controller.js.map