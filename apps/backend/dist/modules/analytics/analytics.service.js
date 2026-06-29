"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../../config/env");
const openai = new openai_1.default({
    apiKey: env_1.env.OPENAI_API_KEY,
    baseURL: env_1.env.OPENAI_BASE_URL,
});
exports.analyticsService = {
    async getSummary(tenantId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const [revenueResult, orderCountResult, avgResult, pendingResult] = await Promise.all([
            database_1.db.select({ total: (0, drizzle_orm_1.sum)(schema_1.orders.totalAmount) })
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.gte)(schema_1.orders.createdAt, startDate), (0, drizzle_orm_1.eq)(schema_1.orders.status, 'delivered'))),
            database_1.db.select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.gte)(schema_1.orders.createdAt, startDate))),
            database_1.db.select({ avg: (0, drizzle_orm_1.sql) `avg(cast(${schema_1.orders.totalAmount} as numeric))` })
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.gte)(schema_1.orders.createdAt, startDate), (0, drizzle_orm_1.eq)(schema_1.orders.status, 'delivered'))),
            database_1.db.select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.orders)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.status, 'pending'))),
        ]);
        return {
            totalRevenue: Number(revenueResult[0]?.total || 0),
            totalOrders: Number(orderCountResult[0]?.count || 0),
            avgOrderValue: Math.round(Number(avgResult[0]?.avg || 0)),
            pendingOrders: Number(pendingResult[0]?.count || 0),
            period: days,
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
    async getAiInsight(tenantId, question) {
        const [summary, topItems, daily] = await Promise.all([
            this.getSummary(tenantId, 30),
            this.getTopItems(tenantId, 5),
            this.getDailyRevenue(tenantId, 7),
        ]);
        const context = `
داده‌های ۳۰ روز گذشته:
- درآمد کل: ${summary.totalRevenue.toLocaleString('fa-IR')} تومان
- تعداد سفارشات: ${summary.totalOrders}
- میانگین سفارش: ${summary.avgOrderValue.toLocaleString('fa-IR')} تومان
- سفارشات در انتظار: ${summary.pendingOrders}

پرفروش‌ترین آیتم‌ها:
${topItems.map((i, idx) => `${idx + 1}. ${i.name}: ${i.totalQuantity} عدد - ${Number(i.totalRevenue || 0).toLocaleString('fa-IR')} تومان`).join('\n')}

درآمد ۷ روز اخیر:
${daily.map(d => `${d.date}: ${Number(d.revenue || 0).toLocaleString('fa-IR')} تومان (${d.orderCount} سفارش)`).join('\n')}
`;
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1000,
            messages: [
                {
                    role: 'system',
                    content: `تو یک مشاور کسب‌وکار هوشمند برای رستوران هستی. داده‌های رستوران:
${context}
تحلیل کوتاه، دقیق و عملی بده. به فارسی پاسخ بده. پیشنهادات کاربردی بده.`,
                },
                { role: 'user', content: question },
            ],
        });
        return response.choices[0]?.message?.content || '';
    },
};
//# sourceMappingURL=analytics.service.js.map