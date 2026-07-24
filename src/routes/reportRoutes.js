const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getReports, uploadReport, deleteReport, getStats, downloadReport } = require('../controllers/reportsController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

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
