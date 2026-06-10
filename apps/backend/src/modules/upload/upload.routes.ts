import { Router } from 'express';
import multer from 'multer';
import { uploadController } from './upload.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('فقط عکس مجاز است'));
  },
});

router.post('/', authenticate, upload.single('image'), uploadController.uploadImage);

export default router;