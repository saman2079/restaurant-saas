"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
exports.analyticsService = {
    async getSummary(tenantId, startDate, endDate) {
        const start = startDate || new Date(new Date().setDate(1)); // اول ماه
        const end = endDate || new Date();
        const [revenueResult, orderCountResult, avgOrderResult] = await Promise.all([
            // کل درآمد
            database_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_1.orders.totalAmount) })
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.gte)(schema_1.orders.createdAt, start), (0, drizzle_orm_1.lte)(schema_1.orders.createdAt, end), (0, drizzle_orm_1.eq)(schema_1.orders.status, 'delivered'))),
            // تعداد سفارشات
            database_1.db.select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.gte)(schema_1.orders.createdAt, start), (0, drizzle_orm_1.lte)(schema_1.orders.createdAt, end))),
            // میانگین سفارش
            database_1.db.select({ avg: (0, drizzle_orm_1.sql) `avg(${schema_1.orders.totalAmount})` })
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.gte)(schema_1.orders.createdAt, start), (0, drizzle_orm_1.lte)(schema_1.orders.createdAt, end), (0, drizzle_orm_1.eq)(schema_1.orders.status, 'delivered'))),
        ]);
        return {
            totalRevenue: revenueResult[0]?.total || 0,
            totalOrders: orderCountResult[0]?.count || 0,
            avgOrderValue: Math.round(avgOrderResult[0]?.avg || 0),
            period: { start, end },
        };
    },
    async getTopItems(tenantId, limit = 10) {
        const result = await database_1.db.select({
            menuItemId: schema_1.orderItems.menuItemId,
            name: schema_1.orderItems.name,
            totalQuantity: (0, drizzle_orm_1.sum)(schema_1.orderItems.quantity),
            totalRevenue: (0, drizzle_orm_1.sum)(schema_1.orderItems.subtotal),
        })
            .from(schema_1.orderItems)
            .innerJoin(schema_1.orders, (0, drizzle_orm_1.eq)(schema_1.orderItems.orderId, schema_1.orders.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.status, 'delivered')))
            .groupBy(schema_1.orderItems.menuItemId, schema_1.orderItems.name)
            .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.sum)(schema_1.orderItems.quantity)))
            .limit(limit);
        return result;
    },
    async getDailyRevenue(tenantId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const result = await database_1.db.select({
            date: (0, drizzle_orm_1.sql) `date(${schema_1.orders.createdAt})`,
            revenue: (0, drizzle_orm_1.sum)(schema_1.orders.totalAmount),
            orderCount: (0, drizzle_orm_1.count)(),
        })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.gte)(schema_1.orders.createdAt, startDate), (0, drizzle_orm_1.eq)(schema_1.orders.status, 'delivered')))
            .groupBy((0, drizzle_orm_1.sql) `date(${schema_1.orders.createdAt})`)
            .orderBy((0, drizzle_orm_1.sql) `date(${schema_1.orders.createdAt})`);
        return result;
    },
    async getHourlyDistribution(tenantId) {
        const result = await database_1.db.select({
            hour: (0, drizzle_orm_1.sql) `extract(hour from ${schema_1.orders.createdAt})`,
            orderCount: (0, drizzle_orm_1.count)(),
        })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId))
            .groupBy((0, drizzle_orm_1.sql) `extract(hour from ${schema_1.orders.createdAt})`)
            .orderBy((0, drizzle_orm_1.sql) `extract(hour from ${schema_1.orders.createdAt})`);
        return result;
    },
};
//# sourceMappingURL=analytics.service.js.map