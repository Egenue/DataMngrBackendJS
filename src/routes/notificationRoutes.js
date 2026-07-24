const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, archiveNotification } = require('../controllers/notificationsController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, getNotifications);
router.post('/', authenticateToken, createNotification);
router.put('/:id/archive', authenticateToken, archiveNotification);

module.exports = router;
