import { Router } from 'express';
import { profileController } from './profile.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', profileController.getMe);
router.patch('/', profileController.update);

export default router;