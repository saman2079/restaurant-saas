import { db } from '../../config/database';
import { orders, orderItems, menuItems } from '../../db/schema';
import { eq, and, gte, lte, desc, sql, sum, count } from 'drizzle-orm';
import OpenAI from 'openai';
import { env } from '../../config/env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_BASE_URL,
});

export const analyticsService = {
  async getSummary(tenantId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [revenueResult, orderCountResult, avgResult, pendingResult] = await Promise.all([
      db.select({ total: sum(orders.totalAmount) })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, startDate),
          eq(orders.status, 'delivered')
        )),

      db.select({ count: count() })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, startDate)
        )),

      db.select({ avg: sql<number>`avg(cast(${orders.totalAmount} as numeric))` })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, startDate),
          eq(orders.status, 'delivered')
        )),

      db.select({ count: count() })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          eq(orders.status, 'pending')
        )),
    ]);

    return {
      totalRevenue: Number(revenueResult[0]?.total || 0),
      totalOrders: Number(orderCountResult[0]?.count || 0),
      avgOrderValue: Math.round(Number(avgResult[0]?.avg || 0)),
      pendingOrders: Number(pendingResult[0]?.count || 0),
      period: days,
    };
  },

  async getTopItems(tenantId: string, limit = 10) {
    const result = await db.select({
      menuItemId: orderItems.menuItemId,
      name: orderItems.name,
      totalQuantity: sum(orderItems.quantity),
      totalRevenue: sum(orderItems.subtotal),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(
      eq(orders.tenantId, tenantId),
      eq(orders.status, 'delivered')
    ))
    .groupBy(orderItems.menuItemId, orderItems.name)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(limit);

    return result;
  },

  async getDailyRevenue(tenantId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db.select({
      date: sql<string>`date(${orders.createdAt})`,
      revenue: sum(orders.totalAmount),
      orderCount: count(),
    })
    .from(orders)
    .where(and(
      eq(orders.tenantId, tenantId),
      gte(orders.createdAt, startDate),
      eq(orders.status, 'delivered')
    ))
    .groupBy(sql`date(${orders.createdAt})`)
    .orderBy(sql`date(${orders.createdAt})`);

    return result;
  },

  async getHourlyDistribution(tenantId: string) {
    const result = await db.select({
      hour: sql<number>`extract(hour from ${orders.createdAt})`,
      orderCount: count(),
    })
    .from(orders)
    .where(eq(orders.tenantId, tenantId))
    .groupBy(sql`extract(hour from ${orders.createdAt})`)
    .orderBy(sql`extract(hour from ${orders.createdAt})`);

    return result;
  },

  async getAiInsight(tenantId: string, question: string) {
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