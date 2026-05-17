import { Router } from 'express';
import { saveOnboarding, updateSettings, deleteAccount } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/onboarding', authenticate, saveOnboarding);
router.put('/settings', authenticate, updateSettings);
router.delete('/account', authenticate, deleteAccount);

export default router;
