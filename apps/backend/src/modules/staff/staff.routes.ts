import { Router } from 'express';
import { staffController } from './staff.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireOwner, requireManager } from '../../middlewares/role.middleware';
import { resolveTenant } from '../../middlewares/tenant.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

router.get('/', requireManager, staffController.getAll);
router.post('/', requireOwner, staffController.create);
router.patch('/:id', requireOwner, staffController.update);
router.delete('/:id', requireOwner, staffController.remove);

export default router;