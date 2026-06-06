import { Router } from 'express';
import { menuController } from './menu.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireManager } from '../../middlewares/role.middleware';
import { resolveTenant } from '../../middlewares/tenant.middleware';

const router = Router({ mergeParams: true });

// ─── عمومی (مشتری) ────────────────────────────────────────
router.get('/full', resolveTenant, menuController.getFullMenu);

// ─── ادمین ────────────────────────────────────────────────
router.use(authenticate, resolveTenant);

// دسته‌بندی
router.get('/categories', menuController.getCategories);
router.post('/categories', requireManager, menuController.createCategory);
router.patch('/categories/:id', requireManager, menuController.updateCategory);
router.delete('/categories/:id', requireManager, menuController.deleteCategory);

// آیتم‌ها
router.get('/items', menuController.getItems);
router.post('/items', requireManager, menuController.createItem);
router.patch('/items/:id', requireManager, menuController.updateItem);
router.delete('/items/:id', requireManager, menuController.deleteItem);

export default router;