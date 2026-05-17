import { Router } from 'express';
import { startSession, stopSession, getActiveSessions, getTodaySessions } from '../controllers/sessionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/start', authenticate, startSession);
router.put('/:id/stop', authenticate, stopSession);
router.get('/active', authenticate, getActiveSessions);
router.get('/today', authenticate, getTodaySessions);

export default router;
