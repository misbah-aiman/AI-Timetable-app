import { Router } from 'express';
import multer from 'multer';
import { generate, getTimetable, getTodaySchedule, scanImage, toggleSlot } from '../controllers/timetableController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Store uploaded images in memory (no disk writes) — 8 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.post('/generate', authenticate, generate);
router.post('/scan-image', authenticate, upload.single('image'), scanImage);
router.get('/', authenticate, getTimetable);
router.get('/today', authenticate, getTodaySchedule);

export default router;
