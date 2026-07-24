import express from 'express';
const router = express.Router();
import { getNotifications, createNotification, archiveNotification } from '../controllers/notificationsController';
import { authenticateToken } from '../middlewares/authMiddleware';

router.get('/', authenticateToken, getNotifications);
router.post('/', authenticateToken, createNotification);
router.put('/:id/archive', authenticateToken, archiveNotification);

module.exports = router;
