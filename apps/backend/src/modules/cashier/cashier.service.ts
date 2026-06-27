import { db } from "../../config/database";
import { orders, orderItems } from "../../db/schema";
import { eq, and, isNull, isNotNull, inArray, sql } from "drizzle-orm";

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

    const isAboveThreshold = totalAmount >= PAYMENT_THRESHOLD;

    await db
      .update(orders)
      .set({
        paidAt: new Date(),
        paymentStatus: "paid",
        // زیر ۵۰۰: confirmed بزن (آشپزخونه نمیخواد)
        // بالای ۵۰۰: status دست نزن، آشپزخونه باید کارشو بکنه
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

  /**
   * میزهای فعال صندوق:
   * ۱. سفارش دارن و هنوز بسته نشدن (completedAt IS NULL)
   * ۲. یا هنوز پرداخت نشدن (paidAt IS NULL = منتظر پرداخت)
   * ۳. یا پرداخت شدن ولی هنوز بسته نشدن (paid + completedAt IS NULL = بالای ۵۰۰ در آشپزخونه)
   * → یعنی فقط completedAt IS NULL کافیه، paidAt مهم نیست
   */
  async getActiveTables(tenantId: string) {
    const activeOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        isNull(orders.completedAt),
        // سفارش کنسل شده نشون نده
        sql`${orders.status} != 'cancelled'`,
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
          isPaid: false,
        });
      }

      const table = tablesMap.get(tableNum);
      table.orders.push(order);
      table.totalAmount += Number(order.totalAmount);
      table.statuses.add(order.status);
      if (order.paidAt) table.isPaid = true;
    }

    return Array.from(tablesMap.values()).map((table) => ({
      tableNumber: table.tableNumber,
      orderCount: table.orders.length,
      totalAmount: table.totalAmount,
      isPaid: table.isPaid,
      orders: table.orders,
      status: table.statuses.has("awaiting_payment")
        ? "awaiting_payment"
        : table.statuses.has("preparing")
          ? "preparing"
          : table.statuses.has("ready")
            ? "ready"
            : table.statuses.has("confirmed")
              ? "confirmed"
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
        isNull(orders.completedAt),
        sql`${orders.status} != 'cancelled'`,
      ),
      with: { items: true },
    });

    const totalAmount = tableOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );

    const isPaid = tableOrders.some((o) => o.paidAt !== null);
    const isAboveThreshold = totalAmount >= PAYMENT_THRESHOLD;

    return {
      tableNumber,
      orders: tableOrders,
      totalAmount,
      isPaid,
      isAboveThreshold,
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

  /**
   * بستن میز:
   * - زیر ۵۰۰: صندوق پول گرفته، سفارش confirmed شده → میشه بست
   * - بالای ۵۰۰: آشپزخونه باید delivered کرده باشه → بعدش میشه بست
   */
  async closeTable(tenantId: string, tableNumber: number) {
    const remainingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.tableNumber, tableNumber),
          isNull(orders.completedAt),
          sql`${orders.status} != 'cancelled'`,
        ),
      );

    if (!remainingOrders.length) {
      throw new Error("سفارشی برای بستن پیدا نشد");
    }

    // بررسی اینکه همه پرداخت شدن
    const hasUnpaid = remainingOrders.some((o) => !o.paidAt);
    if (hasUnpaid) {
      throw new Error("هنوز سفارش‌های پرداخت نشده وجود دارد");
    }

    // بررسی اینکه همه آماده و تحویل داده شدن
    const closableStatuses = ["delivered", "confirmed"];
    const hasOpenOrders = remainingOrders.some(
      (o) => !closableStatuses.includes(o.status),
    );
    if (hasOpenOrders) {
      throw new Error("هنوز سفارش‌هایی در حال آماده‌سازی وجود دارد");
    }

    await db
      .update(orders)
      .set({ completedAt: new Date(), updatedAt: new Date() })
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