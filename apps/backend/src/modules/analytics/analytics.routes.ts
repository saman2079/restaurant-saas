import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireManager } from '../../middlewares/role.middleware';
import { resolveTenant } from '../../middlewares/tenant.middleware';

const router = Router({ mergeParams: true });
router.use(authenticate, resolveTenant, requireManager);

router.get('/summary', analyticsController.getSummary);
router.get('/top-items', analyticsController.getTopItems);
router.get('/daily', analyticsController.getDailyRevenue);
router.get('/hourly', analyticsController.getHourlyDistribution);
router.post('/ai-insight', analyticsController.getAiInsight);

export default router;