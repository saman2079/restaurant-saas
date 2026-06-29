"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashierService = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const PAYMENT_THRESHOLD = 500000;
exports.cashierService = {
    async payTable(tenantId, tableNumber) {
        const tableOrders = await database_1.db
            .select()
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.tableNumber, tableNumber), (0, drizzle_orm_1.isNull)(schema_1.orders.paidAt), (0, drizzle_orm_1.isNull)(schema_1.orders.completedAt)));
        if (!tableOrders.length) {
            throw new Error("سفارشی پیدا نشد");
        }
        const ids = tableOrders.map((o) => o.id);
        const totalAmount = tableOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const isAboveThreshold = totalAmount >= PAYMENT_THRESHOLD;
        await database_1.db
            .update(schema_1.orders)
            .set({
            paidAt: new Date(),
            paymentStatus: "paid",
            // زیر ۵۰۰: confirmed بزن (آشپزخونه نمیخواد)
            // بالای ۵۰۰: status دست نزن، آشپزخونه باید کارشو بکنه
            ...(isAboveThreshold ? {} : { status: "confirmed" }),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.inArray)(schema_1.orders.id, ids));
        const io = global.io;
        if (io) {
            for (const id of ids) {
                const order = await database_1.db.query.orders.findFirst({
                    where: (0, drizzle_orm_1.eq)(schema_1.orders.id, id),
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
    async getActiveTables(tenantId) {
        const activeOrders = await database_1.db.query.orders.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.isNull)(schema_1.orders.completedAt), 
            // سفارش کنسل شده نشون نده
            (0, drizzle_orm_1.sql) `${schema_1.orders.status} != 'cancelled'`),
            with: { items: true },
            orderBy: schema_1.orders.tableNumber,
        });
        const tablesMap = new Map();
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
            if (order.paidAt)
                table.isPaid = true;
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
    async getTableDetail(tenantId, tableNumber) {
        const tableOrders = await database_1.db.query.orders.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.tableNumber, tableNumber), (0, drizzle_orm_1.isNull)(schema_1.orders.completedAt), (0, drizzle_orm_1.sql) `${schema_1.orders.status} != 'cancelled'`),
            with: { items: true },
        });
        const totalAmount = tableOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
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
    summarizeItems(tableOrders) {
        const itemsMap = new Map();
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
    async closeTable(tenantId, tableNumber) {
        const remainingOrders = await database_1.db
            .select()
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.tableNumber, tableNumber), (0, drizzle_orm_1.isNull)(schema_1.orders.completedAt), (0, drizzle_orm_1.sql) `${schema_1.orders.status} != 'cancelled'`));
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
        const hasOpenOrders = remainingOrders.some((o) => !closableStatuses.includes(o.status));
        if (hasOpenOrders) {
            throw new Error("هنوز سفارش‌هایی در حال آماده‌سازی وجود دارد");
        }
        await database_1.db
            .update(schema_1.orders)
            .set({ completedAt: new Date(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.tableNumber, tableNumber), (0, drizzle_orm_1.isNull)(schema_1.orders.completedAt)));
        const io = global.io;
        if (io) {
            io.to(`tenant:${tenantId}`).emit("table-closed", { tableNumber });
        }
        return true;
    },
};
//# sourceMappingURL=cashier.service.js.map