import { db } from "../../config/database";
import { orders, orderItems } from "../../db/schema";
import { eq, and, isNull, inArray, not } from "drizzle-orm";

const PAYMENT_THRESHOLD = 500000;

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
          isNull(orders.completedAt),
        ),
      );

    if (!tableOrders.length) {
      throw new Error("سفارشی پیدا نشد");
    }

    const ids = tableOrders.map((o) => o.id);
    const totalAmount = tableOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );

    // بالای ۵۰۰: پرداخت ثبت میشه، آشپزخونه شروع میکنه (status دست نمیخوره تا closeTable)
    // زیر ۵۰۰: پرداخت + بستن میز یکجا
    const isAboveThreshold = totalAmount >= PAYMENT_THRESHOLD;

    await db
      .update(orders)
      .set({
        paidAt: new Date(),
        paymentStatus: "paid",
        // برای بالای ۵۰۰: status رو دست نزن تا آشپزخونه کارشو بکنه
        // برای زیر ۵۰۰: confirmed بزن چون نیازی به آشپزخونه نیست
        ...(isAboveThreshold ? {} : { status: "confirmed" as any }),
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, ids));

    const io = (global as any).io;
    if (io) {
      for (const id of ids) {
        const order = await db.query.orders.findFirst({
          where: eq(orders.id, id),
          with: { items: true },
        });
        io.to(`tenant:${tenantId}`).emit("order-updated", order);
        io.to(`tenant:${tenantId}`).emit("new-order", order);
      }
    }

    return { success: true, isAboveThreshold };
  },

  // همه میزهای فعال: سفارش دارن، پرداخت نشدن، بسته نشدن
  async getActiveTables(tenantId: string) {
    const activeOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        isNull(orders.paidAt),
        isNull(orders.completedAt),
      ),
      with: { items: true },
      orderBy: orders.tableNumber,
    });

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

  async getTableDetail(tenantId: string, tableNumber: number) {
    const tableOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableNumber, tableNumber),
        isNull(orders.paidAt),
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

  // بستن میز — فقط بعد از اینکه سفارش‌های بالای ۵۰۰ هم آماده شدن
  async closeTable(tenantId: string, tableNumber: number) {
    // سفارش‌هایی که پرداخت شدن ولی هنوز بسته نشدن
    const paidOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.tableNumber, tableNumber),
          isNull(orders.completedAt),
          // paidAt داره (پرداخت شده)
        ),
      );

    // اگه سفارشی هست که هنوز delivered یا cancelled نشده، نمیشه بست
    const hasOpenOrders = paidOrders.some(
      (o) => !["delivered", "cancelled", "confirmed"].includes(o.status),
    );

    if (hasOpenOrders) {
      throw new Error("هنوز سفارش‌هایی در حال آماده‌سازی وجود دارد");
    }

    await db
      .update(orders)
      .set({ completedAt: new Date() })
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.tableNumber, tableNumber),
          isNull(orders.completedAt),
        ),
      );

    const io = (global as any).io;
    if (io) {
      io.to(`tenant:${tenantId}`).emit("table-closed", { tableNumber });
    }

    return true;
  },
};
