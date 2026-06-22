import { redis } from '../../config/redis';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config/database';
import { orders } from '../../db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';

const TTL = 24 * 60 * 60; // 24 ساعت
const key = (tenantId: string, tableNumber: number) =>
  `table_session:${tenantId}:${tableNumber}`;

export const tablesService = {
  async startSession(tenantId: string, tableNumber: number) {
    // اگه session فعال هست، همونو برگردون
    const existing = await redis.get(key(tenantId, tableNumber));
    if (existing) {
      await redis.expire(key(tenantId, tableNumber), TTL);
      return { sessionToken: existing };
    }

    // چک کن میز سفارش پرداخت نشده داره
    const activeOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableNumber, tableNumber),
        sql`${orders.status} != 'cancelled'`,
        isNull(orders.paidAt),
      ),
    });

    if (activeOrder) {
      throw new Error('این میز در حال استفاده است. لطفاً با صندوقدار تماس بگیرید');
    }

    // session جدید بساز
    const sessionToken = uuidv4();
    await redis.setex(key(tenantId, tableNumber), TTL, sessionToken);
    return { sessionToken };
  },

  async validateSession(tenantId: string, tableNumber: number, sessionToken: string) {
    const stored = await redis.get(key(tenantId, tableNumber));
    return stored === sessionToken;
  },

  async clearSession(tenantId: string, tableNumber: number) {
    await redis.del(key(tenantId, tableNumber));
  },
};