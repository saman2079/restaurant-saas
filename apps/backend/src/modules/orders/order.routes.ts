import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireStaff } from '../../middlewares/role.middleware';
import { resolveTenant } from '../../middlewares/tenant.middleware';

const router = Router({ mergeParams: true });

// مشتری میتونه سفارش بده (بدون احراز هویت)
router.post('/', resolveTenant, orderController.create);

// کارمندان
router.use(authenticate, resolveTenant, requireStaff);
router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.patch('/:id/status', orderController.updateStatus);

export default router;