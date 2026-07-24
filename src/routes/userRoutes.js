import express from 'express';
const router = express.Router();
import { getUsers, createUser, toggleUserStatus, getAuditLogs } from '../controllers/usersController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

router.get('/', authenticateToken, authorizeRoles('Admin'), getUsers);
router.post('/', authenticateToken, authorizeRoles('Admin'), createUser);
router.put('/:id/toggle-status', authenticateToken, authorizeRoles('Admin'), toggleUserStatus);
router.get('/audit-logs', authenticateToken, authorizeRoles('Admin'), getAuditLogs);

export default router;
