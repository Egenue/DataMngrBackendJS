import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';

const authRoutes = require('./src/routes/authRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const automationRoutes = require('./src/routes/automationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// Initialize Cron Service
require('./src/services/cronService');

const app = express();

// Middlewares
const defaultOrigins = [
    process.env.ORIGIN1,
    process.env.ORIGIN2,
    process.env.ORIGIN3,
    process.env.ORIGIN4,
    process.env.ORIGIN5,
    process.env.CORS_ORIGIN || "https://data-mngr-iota.vercel.app"
];

const origin = (process.env.CORS_ORIGIN).split(',')

const configuredOrigins = (origin).map(origin => origin.trim()).filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) { 
            return callback(null, true);
        }

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
