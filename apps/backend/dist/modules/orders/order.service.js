"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.setSocketIO = void 0;
const database_1 = require("../../config/database");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
let io;
const setSocketIO = (socketIO) => {
    io = socketIO;
};
exports.setSocketIO = setSocketIO;
exports.orderService = {
    async create(tenantId, data) {
        // گرفتن قیمت آیتم‌ها
        const itemIds = data.items.map(i => i.menuItemId);
        const menuItemsList = await database_1.db.select().from(schema_1.menuItems)
            .where((0, drizzle_orm_1.eq)(schema_1.menuItems.tenantId, tenantId));
        const menuItemsMap = new Map(menuItemsList.map(i => [i.id, i]));
        let totalAmount = 0;
        const orderItemsData = data.items.map(item => {
            const menuItem = menuItemsMap.get(item.menuItemId);
            if (!menuItem)
                throw new Error(`آیتم ${item.menuItemId} پیدا نشد`);
            const price = parseFloat(menuItem.price);
            const subtotal = price * item.quantity;
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
        // ایجاد سفارش
        const [order] = await database_1.db.insert(schema_1.orders).values({
            tenantId,
            tableId: data.tableId,
            tableNumber: data.tableNumber,
            customerName: data.customerName,
            notes: data.notes,
            isAiOrder: data.isAiOrder || false,
            totalAmount: totalAmount.toString(),
            status: 'pending',
        }).returning();
        // ایجاد آیتم‌های سفارش
        const createdItems = await database_1.db.insert(schema_1.orderItems).values(orderItemsData.map(item => ({ ...item, orderId: order.id }))).returning();
        // آپدیت تعداد سفارشات آیتم‌های منو
        for (const item of data.items) {
            await database_1.db.update(schema_1.menuItems)
                .set({ totalOrders: (menuItemsMap.get(item.menuItemId)?.totalOrders || 0) + item.quantity })
                .where((0, drizzle_orm_1.eq)(schema_1.menuItems.id, item.menuItemId));
        }
        const fullOrder = { ...order, items: createdItems };
        // ارسال به آشپزخانه از طریق WebSocket
        if (io) {
            io.to(`tenant:${tenantId}`).emit('new-order', fullOrder);
            io.to(`kitchen:${tenantId}`).emit('new-order', fullOrder);
        }
        return fullOrder;
    },
    async getAll(tenantId, filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const offset = (page - 1) * limit;
        const result = await database_1.db.query.orders.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId),
            with: { items: true },
            orderBy: (0, drizzle_orm_1.desc)(schema_1.orders.createdAt),
            limit,
            offset,
        });
        return result;
    },
    async getById(id, tenantId) {
        const result = await database_1.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.id, id), (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId)),
            with: { items: true },
        });
        if (!result)
            throw new Error('سفارش پیدا نشد');
        return result;
    },
    async updateStatus(id, tenantId, status, userId) {
        const [updated] = await database_1.db.update(schema_1.orders)
            .set({
            status: status,
            updatedAt: new Date(),
            assignedTo: userId,
            ...(status === 'delivered' && { completedAt: new Date() }),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.orders.id, id), (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId)))
            .returning();
        // اطلاع رسانی real-time
        if (io) {
            io.to(`tenant:${tenantId}`).emit('order-updated', updated);
        }
        return updated;
    },
};
//# sourceMappingURL=order.service.js.map