import { db } from '../../config/database';
import { orders, orderItems } from '../../db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';

export const cashierService = {
  // همه میزهای فعال (سفارش دارن و پرداخت نشدن)
  async getActiveTables(tenantId: string) {
    const activeOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        isNull(orders.paidAt),
      ),
      with: { items: true },
      orderBy: orders.tableNumber,
    });

    // گروه‌بندی بر اساس شماره میز
    const tablesMap = new Map<number, any>();

    for (const order of activeOrders) {
      const tableNum = order.tableNumber ?? 0;
      if (!tablesMap.has(tableNum)) {
        tablesMap.set(tableNum, {
          tableNumber: tableNum,
          orders: [],
          totalAmount: 0,
          statuses: new Set(),
        });
      }

      const table = tablesMap.get(tableNum);
      table.orders.push(order);
      table.totalAmount += Number(order.totalAmount);
      table.statuses.add(order.status);
    }

    return Array.from(tablesMap.values()).map(table => ({
      tableNumber: table.tableNumber,
      orderCount: table.orders.length,
      totalAmount: table.totalAmount,
      orders: table.orders,
      // وضعیت کلی میز
      status: table.statuses.has('pending') ? 'pending' :
              table.statuses.has('preparing') ? 'preparing' :
              table.statuses.has('ready') ? 'ready' : 'delivered',
    }));
  },

  // جزئیات یه میز
  async getTableDetail(tenantId: string, tableNumber: number) {
    const tableOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableNumber, tableNumber),
        isNull(orders.paidAt),
      ),
      with: { items: true },
    });

    const totalAmount = tableOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount), 0
    );

    return {
      tableNumber,
      orders: tableOrders,
      totalAmount,
      itemsSummary: this.summarizeItems(tableOrders),
    };
  },

  // خلاصه آیتم‌ها برای فاکتور
  summarizeItems(tableOrders: any[]) {
    const itemsMap = new Map<string, any>();

    for (const order of tableOrders) {
      for (const item of order.items || []) {
        const key = item.name;
        if (!itemsMap.has(key)) {
          itemsMap.set(key, {
            name: item.name,
            quantity: 0,
            unitPrice: Number(item.price),
            totalPrice: 0,
          });
        }
        const existing = itemsMap.get(key);
        existing.quantity += item.quantity;
        existing.totalPrice += Number(item.subtotal);
      }
    }

    return Array.from(itemsMap.values());
  },

  // بستن میز و صدور فاکتور
  async closeTable(tenantId: string, tableNumber: number) {
    const tableOrders = await db.select()
      .from(orders)
      .where(and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableNumber, tableNumber),
        isNull(orders.paidAt),
      ));

    if (tableOrders.length === 0) {
      throw new Error('سفارشی برای این میز پیدا نشد');
    }

    const orderIds = tableOrders.map(o => o.id);

    // همه سفارشات میز رو پرداخت شده علامت بزن
    await db.update(orders)
      .set({
        paidAt: new Date(),
        status: 'delivered',
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, orderIds));

    const totalAmount = tableOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount), 0
    );

    return {
      tableNumber,
      closedAt: new Date(),
      totalAmount,
      orderCount: tableOrders.length,
    };
  },
};