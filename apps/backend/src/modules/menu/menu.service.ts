import { db } from '../../config/database';
import { categories, menuItems } from '../../db/schema';
import { eq, and, asc, desc, ilike } from 'drizzle-orm';
import { redis } from '../../config/redis';

export const menuService = {
  // ─── Categories ───────────────────────────────────────
  async getCategories(tenantId: string) {
    const cacheKey = `menu:categories:${tenantId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await db.select().from(categories)
      .where(and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)))
      .orderBy(asc(categories.sortOrder));

    await redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  },

  async createCategory(tenantId: string, data: {
    name: string; nameEn?: string; icon?: string; image?: string; sortOrder?: number;
  }) {
    const [category] = await db.insert(categories).values({ tenantId, ...data }).returning();
    await redis.del(`menu:categories:${tenantId}`);
    return category;
  },

  async updateCategory(id: string, tenantId: string, data: any) {
    const [updated] = await db.update(categories)
      .set(data)
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)))
      .returning();
    await redis.del(`menu:categories:${tenantId}`);
    return updated;
  },

  async deleteCategory(id: string, tenantId: string) {
    await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)));
    await redis.del(`menu:categories:${tenantId}`);
  },

  // ─── Menu Items ───────────────────────────────────────
  async getItems(
    tenantId: string,
    filters?: {
      categoryId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const conditions = [eq(menuItems.tenantId, tenantId)];

    if (filters?.categoryId) {
      conditions.push(eq(menuItems.categoryId, filters.categoryId));
    }

    return await db
      .select()
      .from(menuItems)
      .where(and(...conditions))
      .orderBy(
        asc(menuItems.sortOrder),
        asc(menuItems.name)
      )
      .limit(limit)
      .offset(offset);
  },
  
  async getItemById(id: string, tenantId: string) {
    const [item] = await db.select().from(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.tenantId, tenantId)));
    if (!item) throw new Error('آیتم پیدا نشد');
    return item;
  },

  async createItem(tenantId: string, data: any) {
    const [item] = await db.insert(menuItems)
      .values({ tenantId, ...data }).returning();
    await this.clearMenuCache(tenantId);
    return item;
  },

  async updateItem(id: string, tenantId: string, data: any) {
    const [updated] = await db.update(menuItems)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(menuItems.id, id), eq(menuItems.tenantId, tenantId)))
      .returning();
    await this.clearMenuCache(tenantId);
    return updated;
  },

  async deleteItem(id: string, tenantId: string) {
    await db.delete(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.tenantId, tenantId)));
    await this.clearMenuCache(tenantId);
  },

  async getFullMenu(tenantId: string) {
    const cacheKey = `menu:full:${tenantId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [cats, items] = await Promise.all([
      db.select().from(categories)
        .where(and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)))
        .orderBy(asc(categories.sortOrder)),
      db.select().from(menuItems)
        .where(and(eq(menuItems.tenantId, tenantId), eq(menuItems.status, 'available')))
        .orderBy(asc(menuItems.sortOrder)),
    ]);

    const result = cats.map(cat => ({
      ...cat,
      items: items.filter(item => item.categoryId === cat.id),
    }));

    await redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  },

  async clearMenuCache(tenantId: string) {
    await redis.del(`menu:full:${tenantId}`);
    await redis.del(`menu:categories:${tenantId}`);
  },
};