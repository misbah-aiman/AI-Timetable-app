import { Router } from 'express';
import { getWeeklyAnalytics, getDashboardStats } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/weekly', authenticate, getWeeklyAnalytics);
router.get('/stats', authenticate, getDashboardStats);

export default router;
