"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.setSocketIO = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const tables_service_1 = require("../tables/tables.service");
let io;
const setSocketIO = (socketIO) => {
    io = socketIO;
};
exports.setSocketIO = setSocketIO;
const PAYMENT_THRESHOLD = 500000; // ۵۰۰ هزار تومن
exports.orderService = {
    async create(tenantId, data) {
        if (data.tableNumber) {
            if (!data.sessionToken)
                throw new Error("SESSION_REQUIRED");
            const isValid = await tables_service_1.tablesService.validateSession(tenantId, data.tableNumber, data.sessionToken);
            if (!isValid)
                throw new Error("SESSION_INVALID");
            const activeOrder = await database_1.db.query.orders.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.tableNumber, data.tableNumber), (0, drizzle_orm_1.sql) `${schema_1.orders.status} NOT IN ('cancelled', 'delivered')`, (0, drizzle_orm_1.isNull)(schema_1.orders.paidAt)),
                with: { items: true },
            });
            if (activeOrder)
                throw new Error(`TABLE_HAS_ACTIVE_ORDER:${activeOrder.id}`);
        }
        const menuItemsList = await database_1.db
            .select()
            .from(schema_1.menuItems)
            .where((0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId));
        const menuMap = new Map(menuItemsList.map((i) => [i.id, i]));
        let totalAmount = 0;
        const itemsData = data.items.map((item) => {
            const menuItem = menuMap.get(item.menuItemId);
            if (!menuItem)
                throw new Error("آیتم پیدا نشد");
            const subtotal = Number(menuItem.price) * item.quantity;
            totalAmount += subtotal;
            return {
                menuItemId: item.menuItemId,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
                notes: item.notes,
                subtotal: subtotal.toString(),
            };
        });
        // اگه مبلغ بالای آستانه بود، status میشه awaiting_payment
        const initialStatus = "pending";
        const paymentStatus = totalAmount >= PAYMENT_THRESHOLD ? "pending" : "not_required";
        const [order] = await database_1.db
            .insert(schema_1.orders)
            .values({
            tenantId,
            tableNumber: data.tableNumber,
            customerName: data.customerName,
            notes: data.notes,
            isAiOrder: data.isAiOrder || false,
            totalAmount: totalAmount.toString(),
            status: initialStatus,
            paymentStatus,
        })
            .returning();
        await database_1.db
            .insert(schema_1.orderItems)
            .values(itemsData.map((item) => ({ ...item, orderId: order.id })));
        const fullOrder = await this.getById(order.id, tenantId);
        const needPayment = totalAmount >= PAYMENT_THRESHOLD;
        if (io) {
            if (needPayment) {
                // فقط صندوق
                io.to(`tenant:${tenantId}`).emit("payment-required", fullOrder);
            }
            else {
                // مستقیم آشپزخانه
                io.to(`tenant:${tenantId}`).emit("new-order", fullOrder);
            }
        }
        return fullOrder;
    },
    // ─── گرفتن سفارش فعال میز (برای مشتری) ───
    async getActiveByTable(tenantId, tableNumber, sessionToken) {
        const isValid = await tables_service_1.tablesService.validateSession(tenantId, tableNumber, sessionToken);
        if (!isValid)
            throw new Error("SESSION_INVALID");
        const order = await database_1.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.tableNumber, tableNumber), (0, drizzle_orm_1.sql) `${schema_1.orders.status} NOT IN ('cancelled', 'delivered')`, (0, drizzle_orm_1.isNull)(schema_1.orders.paidAt)),
            with: { items: true },
        });
        return order || null;
    },
    // ─── ویرایش آیتم‌ها توسط مشتری (با محدودیت بر اساس وضعیت) ───
    async updateItemsByCustomer(orderId, tenantId, tableNumber, sessionToken, newItems) {
        // اعتبارسنجی session
        const isValid = await tables_service_1.tablesService.validateSession(tenantId, tableNumber, sessionToken);
        if (!isValid)
            throw new Error("SESSION_INVALID");
        const order = await database_1.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId), (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.orders.tableNumber, tableNumber)),
        });
        if (!order)
            throw new Error("سفارش پیدا نشد");
        if (order.paidAt)
            throw new Error("سفارش پرداخت شده، قابل ویرایش نیست");
        const menuItemsList = await database_1.db
            .select()
            .from(schema_1.menuItems)
            .where((0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId));
        const menuMap = new Map(menuItemsList.map((i) => [i.id, i]));
        // ─── وضعیت pending: همه چیز ویرایش میشه ───
        if (order.status === "pending") {
            return this._replaceItems(orderId, tenantId, newItems, menuMap);
        }
        // ─── وضعیت confirmed/preparing/ready: فقط اضافه کردن آیتم جدید ───
        if (["confirmed", "preparing", "ready"].includes(order.status)) {
            const existingItems = await database_1.db.query.orderItems.findMany({
                where: (0, drizzle_orm_1.eq)(schema_1.orderItems.orderId, orderId),
            });
            const existingIds = new Set(existingItems.map((i) => i.menuItemId));
            // فقط آیتم‌های جدید (که قبلاً نبودن) قبول میکنیم
            const addedItems = newItems.filter((i) => !existingIds.has(i.menuItemId));
            if (addedItems.length === 0) {
                throw new Error("EDIT_RESTRICTED: بعد از تایید آشپز فقط می‌توانید آیتم جدید اضافه کنید");
            }
            let totalAmount = Number(order.totalAmount);
            const newItemsData = addedItems.map((item) => {
                const menuItem = menuMap.get(item.menuItemId);
                if (!menuItem)
                    throw new Error("آیتم پیدا نشد");
                const subtotal = Number(menuItem.price) * item.quantity;
                totalAmount += subtotal;
                return {
                    orderId,
                    menuItemId: item.menuItemId,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity: item.quantity,
                    notes: item.notes,
                    subtotal: subtotal.toString(),
                };
            });
            await database_1.db.insert(schema_1.orderItems).values(newItemsData);
            await database_1.db
                .update(schema_1.orders)
                .set({ totalAmount: totalAmount.toString(), updatedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId));
            const fullOrder = await this.getById(orderId, tenantId);
            if (io)
                io.to(`tenant:${tenantId}`).emit("order-updated", fullOrder);
            return fullOrder;
        }
        throw new Error("EDIT_NOT_ALLOWED: سفارش قابل ویرایش نیست");
    },
    async _replaceItems(orderId, tenantId, newItems, menuMap) {
        await database_1.db.delete(schema_1.orderItems).where((0, drizzle_orm_1.eq)(schema_1.orderItems.orderId, orderId));
        let totalAmount = 0;
        const itemsData = newItems.map((item) => {
            const menuItem = menuMap.get(item.menuItemId);
            if (!menuItem)
                throw new Error("آیتم پیدا نشد");
            const subtotal = Number(menuItem.price) * item.quantity;
            totalAmount += subtotal;
            return {
                orderId,
                menuItemId: item.menuItemId,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
                notes: item.notes,
                subtotal: subtotal.toString(),
            };
        });
        await database_1.db.insert(schema_1.orderItems).values(itemsData);
        await database_1.db
            .update(schema_1.orders)
            .set({ totalAmount: totalAmount.toString(), updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.orders.id, orderId));
        const fullOrder = await this.getById(orderId, tenantId);
        if (io)
            io.to(`tenant:${tenantId}`).emit("order-updated", fullOrder);
        return fullOrder;
    },
    async getAll(tenantId, filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const offset = (page - 1) * limit;
        return database_1.db.query.orders.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId),
            with: { items: true },
            orderBy: (0, drizzle_orm_1.desc)(schema_1.orders.createdAt),
            limit,
            offset,
        });
    },
    async getById(id, tenantId) {
        const result = await database_1.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.id, id), (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId)),
            with: { items: true },
        });
        if (!result)
            throw new Error("سفارش پیدا نشد");
        return result;
    },
    async getByIdPublic(id) {
        const result = await database_1.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.orders.id, id),
            with: { items: true },
        });
        if (!result)
            throw new Error("سفارش پیدا نشد");
        return result;
    },
    async updateStatus(id, tenantId, status, userId, rejectionReason) {
        const [updated] = await database_1.db
            .update(schema_1.orders)
            .set({
            status: status,
            updatedAt: new Date(),
            assignedTo: userId,
            ...(status === "delivered" && { completedAt: new Date() }),
            ...(status === "cancelled" && rejectionReason && { rejectionReason }),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.id, id), (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId)))
            .returning();
        const fullOrder = await this.getById(id, tenantId);
        if (io) {
            io.to(`tenant:${tenantId}`).emit("order-updated", fullOrder);
            io.to(`order:${id}`).emit("order-status-changed", {
                orderId: id,
                status: updated.status,
                rejectionReason: updated.rejectionReason || "",
            });
        }
        return fullOrder;
    },
    async updateItems(id, tenantId, newItems) {
        const order = await database_1.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.id, id), (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId)),
        });
        if (!order)
            throw new Error("سفارش پیدا نشد");
        if (order.status !== "pending")
            throw new Error("سفارش دیگر قابل ویرایش نیست");
        const menuItemsList = await database_1.db
            .select()
            .from(schema_1.menuItems)
            .where((0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId));
        const menuMap = new Map(menuItemsList.map((i) => [i.id, i]));
        return this._replaceItems(id, tenantId, newItems, menuMap);
    },
};
//# sourceMappingURL=order.service.js.map