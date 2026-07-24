import express from 'express';
const router = express.Router();
import { getNotifications, createNotification, archiveNotification } from '../controllers/notificationsController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

router.get('/', authenticateToken, getNotifications);
router.post('/', authenticateToken, createNotification);
router.put('/:id/archive', authenticateToken, archiveNotification);

export default router;
