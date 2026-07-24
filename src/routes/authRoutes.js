import express from 'express';
const router = express.Router();
import { login, logout } from '../controllers/authController';

router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
