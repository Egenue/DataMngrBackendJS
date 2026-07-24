import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './src/routes/authRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import automationRoutes from './src/routes/automationRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';

// Initialize Cron Service
import './src/services/cronService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();

// Middlewares
const defaultOrigins = [
    process.env.ORIGIN1,
    process.env.ORIGIN2,
    process.env.ORIGIN3,
    process.env.ORIGIN4,
    process.env.ORIGIN5,
    process.env.CORS_ORIGIN
];

const originString = process.env.CORS_ORIGIN || "";
const configuredOrigins = originString.split(',')
    .map(origin => origin.trim().replace(/\/$/, '')) // Remove trailing slash
    .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin matches allowed list (without trailing slash)
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app')) { 
            return callback(null, true);
        }

        console.error(`CORS Error: Origin '${origin}' is not in the allowed list.`);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for downloads
app.use('/Storage/Reports', express.static(path.join(__dirname, 'Storage/Reports')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
