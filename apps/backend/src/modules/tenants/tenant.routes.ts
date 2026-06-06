import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireSuperAdmin, requireOwner } from '../../middlewares/role.middleware';

const router = Router();

// سوپر ادمین
router.get('/', authenticate, requireSuperAdmin, tenantController.getAll);
router.post('/', authenticate, requireSuperAdmin, tenantController.create);
router.patch('/:id/toggle', authenticate, requireSuperAdmin, tenantController.toggleActive);

// عمومی (برای لود اطلاعات رستوران)
router.get('/:slug', tenantController.getBySlug);

// owner خودش میتونه پروفایل رستورانشو آپدیت کنه
router.patch('/:id', authenticate, requireOwner, tenantController.update);

export default router;