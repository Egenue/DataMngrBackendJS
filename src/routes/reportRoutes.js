import express from 'express';
const router = express.Router();
import multer from 'multer';
import { getReports, uploadReport, deleteReport, getStats, downloadReport } from '../controllers/reportsController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Storage/Reports');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

router.get('/', authenticateToken, getReports);
router.post('/upload', authenticateToken, authorizeRoles('Admin'), upload.single('file'), uploadReport);
router.get('/stats', authenticateToken, authorizeRoles('Admin'), getStats);
router.get('/download/:id', authenticateToken, downloadReport);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), deleteReport);

module.exports = router;
