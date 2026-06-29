"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tablesService = void 0;
const redis_1 = require("../../config/redis");
const uuid_1 = require("uuid");
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const TTL = 24 * 60 * 60; // 24 ساعت
const key = (tenantId, tableNumber) => `table_session:${tenantId}:${tableNumber}`;
exports.tablesService = {
    async startSession(tenantId, tableNumber) {
        // اگه session فعال هست، همونو برگردون
        const existing = await redis_1.redis.get(key(tenantId, tableNumber));
        if (existing) {
            await redis_1.redis.expire(key(tenantId, tableNumber), TTL);
            return { sessionToken: existing };
        }
        // چک کن میز سفارش پرداخت نشده داره
        const activeOrder = await database_1.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.tableNumber, tableNumber), (0, drizzle_orm_1.sql) `${schema_1.orders.status} != 'cancelled'`, (0, drizzle_orm_1.isNull)(schema_1.orders.paidAt)),
        });
        if (activeOrder) {
            throw new Error('این میز در حال استفاده است. لطفاً با صندوقدار تماس بگیرید');
        }
        // session جدید بساز
        const sessionToken = (0, uuid_1.v4)();
        await redis_1.redis.setex(key(tenantId, tableNumber), TTL, sessionToken);
        return { sessionToken };
    },
    async validateSession(tenantId, tableNumber, sessionToken) {
        const stored = await redis_1.redis.get(key(tenantId, tableNumber));
        return stored === sessionToken;
    },
    async clearSession(tenantId, tableNumber) {
        await redis_1.redis.del(key(tenantId, tableNumber));
    },
};
//# sourceMappingURL=tables.service.js.map