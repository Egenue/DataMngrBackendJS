import express from 'express';
const router = express.Router();
import { getUsers, createUser, toggleUserStatus, getAuditLogs } from '../controllers/usersController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

router.get('/', authenticateToken, authorizeRoles('Admin'), getUsers);
router.post('/', authenticateToken, authorizeRoles('Admin'), createUser);
router.put('/:id/toggle-status', authenticateToken, authorizeRoles('Admin'), toggleUserStatus);
router.get('/audit-logs', authenticateToken, authorizeRoles('Admin'), getAuditLogs);

module.exports = router;
