import { Router, Response } from 'express';
import { tablesService } from './tables.service';
import { sendSuccess, sendError } from '../../utils/response';
import { resolveTenant } from '../../middlewares/tenant.middleware';
import { AuthRequest } from '../../types';

const router = Router({ mergeParams: true });

router.post('/session', resolveTenant, async (req: AuthRequest, res: Response) => {
  try {
    const { tableNumber } = req.body;
    if (!tableNumber) return sendError(res, 'شماره میز لازم است');

    const result = await tablesService.startSession(req.tenantId!, parseInt(tableNumber));
    return sendSuccess(res, result);
  } catch (e: any) {
    return sendError(res, e.message, 403);
  }
});

export default router;