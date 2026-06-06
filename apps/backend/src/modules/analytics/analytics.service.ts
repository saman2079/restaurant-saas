import { db } from '../../config/database';
import { orders, orderItems, menuItems } from '../../db/schema';
import { eq, and, gte, lte, desc, sql, sum, count } from 'drizzle-orm';

export const analyticsService = {
  async getSummary(tenantId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(1)); // اول ماه
    const end = endDate || new Date();
    
    const [revenueResult, orderCountResult, avgOrderResult] = await Promise.all([
      // کل درآمد
      db.select({ total: sum(orders.totalAmount) })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, start),
          lte(orders.createdAt, end),
          eq(orders.status, 'delivered')
        )),
      
      // تعداد سفارشات
      db.select({ count: count() })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, start),
          lte(orders.createdAt, end)
        )),
      
      // میانگین سفارش
      db.select({ avg: sql<number>`avg(${orders.totalAmount})` })
        .from(orders)
        .where(and(
          eq(orders.tenantId, tenantId),
          gte(orders.createdAt, start),
          lte(orders.createdAt, end),
          eq(orders.status, 'delivered')
        )),
    ]);
    
    return {
      totalRevenue: revenueResult[0]?.total || 0,
      totalOrders: orderCountResult[0]?.count || 0,
      avgOrderValue: Math.round(avgOrderResult[0]?.avg || 0),
      period: { start, end },
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
};