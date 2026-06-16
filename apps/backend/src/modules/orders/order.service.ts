import { db } from '../../config/database';
import { orders, orderItems, menuItems } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Server as SocketServer } from 'socket.io';

let io: SocketServer;

export const setSocketIO = (socketIO: SocketServer) => {
  io = socketIO;
};

export const orderService = {
  async create(tenantId: string, data: {
    tableNumber?: number;
    tableId?: string;
    customerName?: string;
    notes?: string;
    isAiOrder?: boolean;
    items: Array<{ menuItemId: string; quantity: number; notes?: string }>;
  }) {
    const menuItemsList = await db.select().from(menuItems)
      .where(eq(menuItems.tenantId, tenantId));

    const menuMap = new Map(menuItemsList.map(i => [i.id, i]));

    let totalAmount = 0;
    const itemsData = data.items.map(item => {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) throw new Error(`آیتم پیدا نشد`);
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

    // emit به پنل ادمین
    if (io) {
      io.to(`tenant:${tenantId}`).emit('new-order', fullOrder);
      console.log(`📢 new-order emit به tenant:${tenantId}`);
    }

    return fullOrder;
  },

  async getAll(tenantId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const result = await db.query.orders.findMany({
      where: eq(orders.tenantId, tenantId),
      with: { items: true },
      orderBy: desc(orders.createdAt),
      limit,
      offset,
    });

    return result;
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

  async updateStatus(
    id: string,
    tenantId: string,
    status: string,
    userId: string,
    rejectionReason?: string
  ) {
    const [updated] = await db.update(orders)
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
      // به پنل ادمین
      io.to(`tenant:${tenantId}`).emit('order-updated', fullOrder);

      // به مشتری
      io.to(`order:${id}`).emit('order-status-changed', {
        orderId: id,
        status: updated.status,
        rejectionReason: (updated as any).rejectionReason || '',
      });

      console.log(`📢 order-updated emit - status: ${status}`);
    }

    return fullOrder;
  },

  async updateItems(
    id: string,
    tenantId: string,
    newItems: Array<{ menuItemId: string; quantity: number; notes?: string }>
  ) {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
    });

    if (!order) throw new Error('سفارش پیدا نشد');
    if (order.status !== 'pending') throw new Error('سفارش دیگر قابل ویرایش نیست');

    await db.delete(orderItems).where(eq(orderItems.orderId, id));

    const menuItemsList = await db.select().from(menuItems)
      .where(eq(menuItems.tenantId, tenantId));
    const menuMap = new Map(menuItemsList.map(i => [i.id, i]));

    let totalAmount = 0;
    const itemsData = newItems.map(item => {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) throw new Error('آیتم پیدا نشد');
      const subtotal = Number(menuItem.price) * item.quantity;
      totalAmount += subtotal;
      return {
        orderId: id,
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        notes: item.notes,
        subtotal: subtotal.toString(),
      };
    });

    await db.insert(orderItems).values(itemsData);

    const [updated] = await db.update(orders)
      .set({ totalAmount: totalAmount.toString(), updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    const fullOrder = await this.getById(id, tenantId);

    if (io) {
      io.to(`tenant:${tenantId}`).emit('order-updated', fullOrder);
    }

    return fullOrder;
  },
};