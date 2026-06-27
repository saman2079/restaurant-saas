import { db } from "../../config/database";
import { orders, orderItems } from "../../db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

export const cashierService = {
  async payTable(tenantId: string, tableNumber: number) {
    const tableOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.tableNumber, tableNumber),
          isNull(orders.paidAt),
        ),
      );

    if (!tableOrders.length) {
      throw new Error("سفارشی پیدا نشد");
    }

    const ids = tableOrders.map((o) => o.id);

    await db
      .update(orders)
      .set({
        paidAt: new Date(),
        paymentStatus: "paid", // اضافه کن
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, ids));

    const io = (global as any).io;

    if (io) {
      for (const id of ids) {
        const order = await db.query.orders.findFirst({
          where: eq(orders.id, id),
          with: {
            items: true,
          },
        });

        io.to(`tenant:${tenantId}`).emit("order-updated", order);

        io.to(`tenant:${tenantId}`).emit("new-order", order);
      }
    }

    return true;
  },
  // همه میزهای فعال (سفارش دارن و پرداخت نشدن)
  async getActiveTables(tenantId: string) {
    const activeOrders = await db.query.orders.findMany({
      where: and(eq(orders.tenantId, tenantId), isNull(orders.completedAt)),
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

    return Array.from(tablesMap.values()).map((table) => ({
      tableNumber: table.tableNumber,
      orderCount: table.orders.length,
      totalAmount: table.totalAmount,
      orders: table.orders,
      // وضعیت کلی میز
      status: table.statuses.has("awaiting_payment")
        ? "awaiting_payment"
        : table.statuses.has("confirmed")
          ? "confirmed"
          : table.statuses.has("preparing")
            ? "preparing"
            : table.statuses.has("ready")
              ? "ready"
              : table.statuses.has("pending")
                ? "pending"
                : "delivered",
    }));
  },

  // جزئیات یه میز
  async getTableDetail(tenantId: string, tableNumber: number) {
    const tableOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableNumber, tableNumber),
        isNull(orders.completedAt),
      ),
      with: { items: true },
    });

    const totalAmount = tableOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
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
    const remain = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.tableNumber, tableNumber),
          isNull(orders.completedAt),
        ),
      );

    if (remain.some((o) => !["delivered", "cancelled"].includes(o.status))) {
      throw new Error("هنوز سفارش‌های باز وجود دارد");
    }

    await db
      .update(orders)
      .set({
        completedAt: new Date(),
      })
      .where(
        and(eq(orders.tenantId, tenantId), eq(orders.tableNumber, tableNumber)),
      );

    return true;
  },
};
