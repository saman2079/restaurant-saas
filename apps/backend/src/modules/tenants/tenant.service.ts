import { db } from '../../config/database';
import { tenants, users } from '../../db/schema';
import { eq, ilike, count } from 'drizzle-orm';
import slugify from 'slugify';
import { hashPassword } from '../../utils/hash';
import { redis } from '../../config/redis';

export const tenantService = {
  async getAll(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(tenants);
    if (search) {
      query = query.where(ilike(tenants.name, `%${search}%`)) as any;
    }
    
    const [allTenants, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.select({ count: count() }).from(tenants),
    ]);
    
    return { tenants: allTenants, total: totalResult[0].count };
  },
  
  async getBySlug(slug: string) {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    if (!tenant) throw new Error('رستوران پیدا نشد');
    return tenant;
  },
  
  async create(data: {
    name: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    plan?: 'basic' | 'pro' | 'business';
  }) {
    const slug = slugify(data.name, { lower: true, strict: true, locale: 'en' });
    
    // چک slug تکراری
    const existing = await db.select().from(tenants).where(eq(tenants.slug, slug));
    if (existing.length > 0) {
      throw new Error('این نام قبلاً ثبت شده است');
    }
    
    // ایجاد رستوران
    const [tenant] = await db.insert(tenants).values({
      name: data.name,
      slug,
      plan: data.plan || 'basic',
    }).returning();
    
    // ایجاد owner
    const hashedPassword = await hashPassword(data.ownerPassword);
    const [owner] = await db.insert(users).values({
      tenantId: tenant.id,
      name: data.ownerName,
      email: data.ownerEmail,
      password: hashedPassword,
      role: 'owner',
    }).returning();
    
    const { password: _, ...ownerWithoutPassword } = owner;
    return { tenant, owner: ownerWithoutPassword };
  },
  
  async update(id: string, data: Partial<typeof tenants.$inferInsert>) {
    // کش رو پاک کن
    const [existing] = await db.select().from(tenants).where(eq(tenants.id, id));
    if (existing) {
      await redis.del(`tenant:${existing.slug}`);
    }
    
    const [updated] = await db.update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    
    return updated;
  },
  
  async toggleActive(id: string) {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    if (!tenant) throw new Error('رستوران پیدا نشد');
    
    await redis.del(`tenant:${tenant.slug}`);
    
    const [updated] = await db.update(tenants)
      .set({ isActive: !tenant.isActive, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    
    return updated;
  },
};