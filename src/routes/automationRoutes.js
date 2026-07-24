const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerReport, getStatus, getScripts, triggerScript } = require('../controllers/automationController');

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

module.exports = router;
