import express from 'express';
import { login, getMe, getDemoUsers } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.get('/demo-users', getDemoUsers);

export default router;
