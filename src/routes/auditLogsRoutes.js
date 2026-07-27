import express from 'express';
const router = express.Router();
import { getSystemLogs, getDownloadHistory, getLoginHistory } from '../controllers/auditLogsController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

router.get('/system-logs', authenticateToken, getSystemLogs);
router.get('/download-history', authenticateToken, getDownloadHistory);
router.get('/login-history', authenticateToken, getLoginHistory);

export default router;
