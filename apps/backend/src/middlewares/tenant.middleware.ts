import { Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';

import { AuthRequest } from '../types';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { tenants } from '../db/schema';
import { sendError } from '../utils/response';

export const resolveTenant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const slug =
    typeof req.params.slug === 'string'
      ? req.params.slug
      : typeof req.headers['x-tenant-slug'] === 'string'
        ? req.headers['x-tenant-slug']
        : undefined;

  if (!slug) {
    return sendError(res, 'رستوران مشخص نشده', 400);
  }

  let tenant: typeof tenants.$inferSelect | null = null;

  // ==========================
  // Redis Cache
  // ==========================
  const cached = await redis.get(`tenant:${slug}`);

  if (cached) {
    tenant = JSON.parse(cached);
  } else {
    const [dbTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug));

    if (!dbTenant || !dbTenant.isActive) {
      return sendError(res, 'رستوران پیدا نشد', 404);
    }

    tenant = dbTenant;

    // Cache for 5 minutes
    await redis.setex(
      `tenant:${slug}`,
      300,
      JSON.stringify(tenant)
    );
  }

  // ==========================
  // Security Check
  // ==========================
  if (req.user && req.user.role !== 'super_admin') {
    if (req.user.tenantId !== tenant.id) {
      return sendError(res, 'دسترسی غیرمجاز', 403);
    }
  }

  req.tenant = tenant;
  req.tenantId = tenant.id;

  next();
};