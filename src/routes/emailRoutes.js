import express from 'express';
const router = express.Router();
import { getHistory, getGroups } from '../controllers/emailsController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

router.get('/history', authenticateToken, getHistory);
router.get('/groups', authenticateToken, getGroups);

export default router;
