import { db } from "../../config/database";
import { orders, orderItems, menuItems } from "../../db/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { Server as SocketServer } from "socket.io";
import { tablesService } from "../tables/tables.service";

let io: SocketServer;

export const setSocketIO = (socketIO: SocketServer) => {
  io = socketIO;
};

export const orderService = {
  async create(tenantId: string, data: {
    tableNumber?: number;
    sessionToken?: string;
    tableId?: string;
    customerName?: string;
    notes?: string;
    isAiOrder?: boolean;
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
  }) {
    // ─── امنیت: بدون میز اصلاً سفارش نمیگیریم ───
    if (!data.tableNumber) {
      throw new Error('TABLE_REQUIRED: شماره میز الزامی است');
    }

    // ─── sessionToken باید باشه ───
    if (!data.sessionToken) {
      throw new Error('SESSION_REQUIRED: لطفاً QR کد میز را اسکن کنید');
    }

    // ─── session باید معتبر باشه ───
    const isValid = await tablesService.validateSession(
      tenantId,
      data.tableNumber,
      data.sessionToken,
    );
    if (!isValid) {
      throw new Error('SESSION_INVALID: جلسه منقضی شده. لطفاً QR کد را دوباره اسکن کنید');
    }

    // ─── میز نباید سفارش فعال داشته باشه ───
    const activeOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableNumber, data.tableNumber),
        sql`${orders.status} != 'cancelled'`,
        isNull(orders.paidAt),
      ),
      with: { items: true },
    });

    if (activeOrder) {
      throw new Error(`TABLE_HAS_ACTIVE_ORDER:${activeOrder.id}`);
    }

    // ─── ساخت سفارش ───
    const menuItemsList = await db.select().from(menuItems)
      .where(eq(menuItems.tenantId, tenantId));
    const menuMap = new Map(menuItemsList.map(i => [i.id, i]));

    let totalAmount = 0;
    const itemsData = data.items.map(item => {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) throw new Error('آیتم پیدا نشد');
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

    const [order] = await db.insert(orders).values({
      tenantId,
      tableId: data.tableId,
      tableNumber: data.tableNumber,
      customerName: data.customerName,
      notes: data.notes,
      isAiOrder: data.isAiOrder || false,
      totalAmount: totalAmount.toString(),
      status: 'pending',
    }).returning();

    await db.insert(orderItems).values(
      itemsData.map(item => ({ ...item, orderId: order.id }))
    );

    const fullOrder = await this.getById(order.id, tenantId);

    if (io) io.to(`tenant:${tenantId}`).emit('new-order', fullOrder);

    return fullOrder;
  },

  // ─── گرفتن سفارش فعال میز (برای مشتری) ───
  async getActiveByTable(tenantId: string, tableNumber: number, sessionToken: string) {
    const isValid = await tablesService.validateSession(tenantId, tableNumber, sessionToken);
    if (!isValid) throw new Error('SESSION_INVALID');

    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableNumber, tableNumber),
        sql`${orders.status} NOT IN ('cancelled', 'delivered')`,
        isNull(orders.paidAt),
      ),
      with: { items: true },
    });

    return order || null;
  },

  // ─── ویرایش آیتم‌ها توسط مشتری (با محدودیت بر اساس وضعیت) ───
  async updateItemsByCustomer(
    orderId: string,
    tenantId: string,
    tableNumber: number,
    sessionToken: string,
    newItems: Array<{ menuItemId: string; quantity: number; notes?: string }>,
  ) {
    // اعتبارسنجی session
    const isValid = await tablesService.validateSession(tenantId, tableNumber, sessionToken);
    if (!isValid) throw new Error('SESSION_INVALID');

    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.tenantId, tenantId),
        eq(orders.tableNumber, tableNumber),
      ),
    });

    if (!order) throw new Error('سفارش پیدا نشد');
    if (order.paidAt) throw new Error('سفارش پرداخت شده، قابل ویرایش نیست');

    const menuItemsList = await db.select().from(menuItems)
      .where(eq(menuItems.tenantId, tenantId));
    const menuMap = new Map(menuItemsList.map(i => [i.id, i]));

    // ─── وضعیت pending: همه چیز ویرایش میشه ───
    if (order.status === 'pending') {
      return this._replaceItems(orderId, tenantId, newItems, menuMap);
    }

    // ─── وضعیت confirmed/preparing/ready: فقط اضافه کردن آیتم جدید ───
    if (['confirmed', 'preparing', 'ready'].includes(order.status)) {
      const existingItems = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId),
      });
      const existingIds = new Set(existingItems.map(i => i.menuItemId));

      // فقط آیتم‌های جدید (که قبلاً نبودن) قبول میکنیم
      const addedItems = newItems.filter(i => !existingIds.has(i.menuItemId));
      if (addedItems.length === 0) {
        throw new Error('EDIT_RESTRICTED: بعد از تایید آشپز فقط می‌توانید آیتم جدید اضافه کنید');
      }

      let totalAmount = Number(order.totalAmount);
      const newItemsData = addedItems.map(item => {
        const menuItem = menuMap.get(item.menuItemId);
        if (!menuItem) throw new Error('آیتم پیدا نشد');
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

      await db.insert(orderItems).values(newItemsData);
      await db.update(orders)
        .set({ totalAmount: totalAmount.toString(), updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      const fullOrder = await this.getById(orderId, tenantId);
      if (io) io.to(`tenant:${tenantId}`).emit('order-updated', fullOrder);
      return fullOrder;
    }

    throw new Error('EDIT_NOT_ALLOWED: سفارش قابل ویرایش نیست');
  },

  async _replaceItems(
    orderId: string,
    tenantId: string,
    newItems: Array<{ menuItemId: string; quantity: number; notes?: string }>,
    menuMap: Map<string, any>,
  ) {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));

    let totalAmount = 0;
    const itemsData = newItems.map(item => {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) throw new Error('آیتم پیدا نشد');
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

    await db.insert(orderItems).values(itemsData);
    await db.update(orders)
      .set({ totalAmount: totalAmount.toString(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    const fullOrder = await this.getById(orderId, tenantId);
    if (io) io.to(`tenant:${tenantId}`).emit('order-updated', fullOrder);
    return fullOrder;
  },

  async getAll(tenantId: string, filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    return db.query.orders.findMany({
      where: eq(orders.tenantId, tenantId),
      with: { items: true },
      orderBy: desc(orders.createdAt),
      limit,
      offset,
    });
  },

  async getById(id: string, tenantId: string) {
    const result = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
      with: { items: true },
    });
    if (!result) throw new Error('سفارش پیدا نشد');
    return result;
  },

  async getByIdPublic(id: string) {
    const result = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });
    if (!result) throw new Error('سفارش پیدا نشد');
    return result;
  },

  async updateStatus(id: string, tenantId: string, status: string, userId: string, rejectionReason?: string) {
    const [updated] = await db
      .update(orders)
      .set({
        status: status as any,
        updatedAt: new Date(),
        assignedTo: userId,
        ...(status === 'delivered' && { completedAt: new Date() }),
        ...(status === 'cancelled' && rejectionReason && { rejectionReason }),
      })
      .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)))
      .returning();

    const fullOrder = await this.getById(id, tenantId);

    if (io) {
      io.to(`tenant:${tenantId}`).emit('order-updated', fullOrder);
      io.to(`order:${id}`).emit('order-status-changed', {
        orderId: id,
        status: updated.status,
        rejectionReason: (updated as any).rejectionReason || '',
      });
    }

    return fullOrder;
  },

  async updateItems(id: string, tenantId: string, newItems: Array<{ menuItemId: string; quantity: number; notes?: string }>) {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
    });

    if (!order) throw new Error('سفارش پیدا نشد');
    if (order.status !== 'pending') throw new Error('سفارش دیگر قابل ویرایش نیست');

    const menuItemsList = await db.select().from(menuItems).where(eq(menuItems.tenantId, tenantId));
    const menuMap = new Map(menuItemsList.map(i => [i.id, i]));

    return this._replaceItems(id, tenantId, newItems, menuMap);
  },
};