const express = require('express');
const router = express.Router();
const { getUsers, createUser, toggleUserStatus, getAuditLogs } = require('../controllers/usersController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, authorizeRoles('Admin'), getUsers);
router.post('/', authenticateToken, authorizeRoles('Admin'), createUser);
router.put('/:id/toggle-status', authenticateToken, authorizeRoles('Admin'), toggleUserStatus);
router.get('/audit-logs', authenticateToken, authorizeRoles('Admin'), getAuditLogs);

module.exports = router;
