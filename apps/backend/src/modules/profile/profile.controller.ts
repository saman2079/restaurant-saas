import { Response } from 'express';
import { db } from '../../config/database';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../../utils/hash';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../types';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export const profileController = {
  async getMe(req: AuthRequest, res: Response) {
    try {
      const [user] = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatar: users.avatar,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.id, req.user!.userId));

      if (!user) return sendError(res, 'کاربر پیدا نشد', 404);
      return sendSuccess(res, user);
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const body = updateSchema.parse(req.body);
      const updateData: any = { updatedAt: new Date() };

      if (body.name) updateData.name = body.name;
      if (body.avatar) updateData.avatar = body.avatar;

      // تغییر رمز عبور
      if (body.newPassword) {
        if (!body.currentPassword) {
          return sendError(res, 'رمز عبور فعلی را وارد کنید');
        }

        const [user] = await db.select().from(users)
          .where(eq(users.id, req.user!.userId));

        const isValid = await comparePassword(body.currentPassword, user.password);
        if (!isValid) return sendError(res, 'رمز عبور فعلی اشتباه است');

        updateData.password = await hashPassword(body.newPassword);
      }

      const [updated] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, req.user!.userId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          avatar: users.avatar,
        });

      return sendSuccess(res, updated, 'پروفایل بروز شد');
    } catch (e: any) {
      return sendError(res, e.message);
    }
  },
};