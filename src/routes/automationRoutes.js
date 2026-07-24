import express from 'express';
const router = express.Router();
import multer from 'multer';
import { registerReport, getStatus, getScripts, triggerScript } from '../controllers/automationController.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Storage/Reports');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

router.post('/register-report', upload.single('file'), registerReport);
router.get('/status', getStatus);
router.get('/scripts', getScripts);
router.post('/trigger', triggerScript);

export default router;
