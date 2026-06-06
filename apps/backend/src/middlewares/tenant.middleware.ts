import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { db } from '../config/database';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendError } from '../utils/response';
import { redis } from '../config/redis';

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

  // اول از Redis چک کن
  const cached = await redis.get(`tenant:${slug}`);
  if (cached) {
    req.tenant = JSON.parse(cached);
    req.tenantId = req.tenant.id;
    return next();
  }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));

  if (!tenant || !tenant.isActive) {
    return sendError(res, 'رستوران پیدا نشد', 404);
  }

  // کش کن برای ۵ دقیقه
  await redis.setex(`tenant:${slug}`, 300, JSON.stringify(tenant));

  req.tenant = tenant;
  req.tenantId = tenant.id;
  next();
};