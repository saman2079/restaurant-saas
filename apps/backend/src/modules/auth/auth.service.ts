import { db } from "../../config/database";
import { users, tenants } from "../../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "../../utils/hash";
import { signToken } from "../../utils/jwt";
import { redis } from "../../config/redis";
import { env } from "../../config/env";

export const authService = {
  async login(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !user.isActive) {
      throw new Error("ایمیل یا رمز عبور اشتباه است");
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      throw new Error("ایمیل یا رمز عبور اشتباه است");
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    let tenantSlug: string | null = null;
    let tenantPlan: "basic" | "pro" | "business" = "basic";

    if (user.tenantId) {
      const [tenant] = await db
        .select({
          slug: tenants.slug,
          plan: tenants.plan,
        })
        .from(tenants)
        .where(eq(tenants.id, user.tenantId));

      tenantSlug = tenant?.slug ?? null;
      tenantPlan = tenant?.plan ?? "basic";
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: {
        ...userWithoutPassword,
        tenantSlug,
        plan: tenantPlan,
      },
    };
  },

  async logout(token: string) {
    await redis.setex(`blacklist:${token}`, 7 * 24 * 60 * 60, "1");
  },

  async getMe(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("کاربر پیدا نشد");
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async createSuperAdmin() {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, env.SUPER_ADMIN_EMAIL));

    if (existing.length > 0) return;

    const hashed = await hashPassword(env.SUPER_ADMIN_PASSWORD);
    await db.insert(users).values({
      name: "Super Admin",
      email: env.SUPER_ADMIN_EMAIL,
      password: hashed,
      role: "super_admin",
      tenantId: null,
    });

    console.log("✅ Super Admin ساخته شد");
  },
};
