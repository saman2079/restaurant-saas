import { db } from '../../config/database';
import { users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '../../utils/hash';

type UserRole =
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'waiter'
  | 'chef';

export const staffService = {
  async getAll(tenantId: string) {
    const result = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      avatar: users.avatar,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.tenantId, tenantId));
    return result;
  },

  async create(tenantId: string, data: {
    name: string; email: string; password: string;
    role: 'manager' | 'waiter' | 'chef';
  }) {
    const existing = await db.select().from(users).where(eq(users.email, data.email));
    if (existing.length > 0) throw new Error('این ایمیل قبلاً ثبت شده');

    const hashed = await hashPassword(data.password);
    const [user] = await db.insert(users).values({
      tenantId,
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role,
    }).returning();

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async update(id: string, tenantId: string, data: {
    name?: string;
    role?: UserRole;
     isActive?: boolean;
  }) {
    const [updated] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
      .returning();

    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  },

  async delete(id: string, tenantId: string) {
    await db.delete(users)
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
  },
};