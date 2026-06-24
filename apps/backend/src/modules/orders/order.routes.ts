import { Router } from 'express'
import { orderController } from './order.controller'
import { authenticate } from '../../middlewares/auth.middleware'
import { requireStaff } from '../../middlewares/role.middleware'
import { resolveTenant } from '../../middlewares/tenant.middleware'

const router = Router({ mergeParams: true })

// --- بخش مشتری (نیاز به auth کارمندی ندارد) ---
router.post('/', resolveTenant, orderController.create)
router.get('/public/:id', resolveTenant, orderController.getByIdPublic)

// این دو خط جدید را اینجا اضافه کن:
router.get('/active-table', resolveTenant, orderController.getActiveByTable)
router.patch('/:id/customer', resolveTenant, orderController.updateByCustomer)

router.patch('/:id/items', resolveTenant, orderController.updateItems)

// --- بخش کارمندان (نیاز به auth و سطح دسترسی دارند) ---
router.use(authenticate, resolveTenant, requireStaff)
router.get('/', orderController.getAll)
router.get('/:id', orderController.getById)
router.patch('/:id/status', orderController.updateStatus)

export default router
