import { db } from '../../config/database';
import { orders, orderItems, menuItems, tables } from '../../db/schema';
import { eq, and, gte, lte, desc, count, sum } from 'drizzle-orm';
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
    items: Array<{
      menuItemId: string;
      quantity: number;
      notes?: string;
    }>;
  }) {
    // گرفتن قیمت آیتم‌ها
    const itemIds = data.items.map(i => i.menuItemId);
    const menuItemsList = await db.select().from(menuItems)
      .where(eq(menuItems.tenantId, tenantId));
    
    const menuItemsMap = new Map(menuItemsList.map(i => [i.id, i]));
    
    let totalAmount = 0;
    const orderItemsData = data.items.map(item => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem) throw new Error(`آیتم ${item.menuItemId} پیدا نشد`);
      
      const price = parseFloat(menuItem.price as string);
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
    
    // ایجاد آیتم‌های سفارش
    const createdItems = await db.insert(orderItems).values(
      orderItemsData.map(item => ({ ...item, orderId: order.id }))
    ).returning();
    
    // آپدیت تعداد سفارشات آیتم‌های منو
    for (const item of data.items) {
      await db.update(menuItems)
        .set({ totalOrders: (menuItemsMap.get(item.menuItemId)?.totalOrders || 0) + item.quantity })
        .where(eq(menuItems.id, item.menuItemId));
    }
    
    const fullOrder = { ...order, items: createdItems };
    
    // ارسال به آشپزخانه از طریق WebSocket
    if (io) {
      io.to(`tenant:${tenantId}`).emit('new-order', fullOrder);
      io.to(`kitchen:${tenantId}`).emit('new-order', fullOrder);
    }
    
    return fullOrder;
  },
  
  async getAll(tenantId: string, filters?: {
    status?: string;
    tableNumber?: number;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
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
  
  async updateStatus(id: string, tenantId: string, status: string, userId: string) {
    const [updated] = await db.update(orders)
      .set({
        status: status as any,
        updatedAt: new Date(),
        assignedTo: userId,
        ...(status === 'delivered' && { completedAt: new Date() }),
      })
      .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)))
      .returning();
    
    // اطلاع رسانی real-time
    if (io) {
      io.to(`tenant:${tenantId}`).emit('order-updated', updated);
    }
    
    return updated;
  },
};