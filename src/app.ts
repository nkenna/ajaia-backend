import express, { type Request, type Response, type NextFunction } from 'express';
import { errorHandler } from './middlewares/errorHandler';
import AppRoutes from '../src/routes';
import dns from 'dns';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from '../src/config/config';
import cors from "cors";
import loggerMorgan from "morgan";
import winston from 'winston';
import cookieParser from "cookie-parser";
import { prisma } from './lib/prisma';

dns.setDefaultResultOrder('ipv4first');


const app = express();

app.set('trust proxy', 1); // trust the first proxy hop

// cors — must come before helmet and all routes
app.use(cors(config.cors));


app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// winston
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

// logger
app.use(loggerMorgan("dev", { stream: { write: message => logger.info(message.trim()) } }));

app.use(express.json({
    verify: (req: any, _res, buf) => {
        try {
            req.rawBody = buf.toString('utf8');
        } catch {
            req.rawBody = undefined;
        }
    }
}));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get('/', (req, res) => {
    res.status(200).json({ message: "API is running." });
});

app.get('/health', async (req, res) => {
    try {
        const payload: any = {
            status: 'ok',
            server: 'running',
            database: 'unknown',
        };

        // Check DB
        try {
            await prisma.$queryRaw`SELECT 1`;
            payload.database = 'connected';
        } catch (error) {
            payload.database = 'disconnected';
            payload.status = 'error';
        }

        const statusCode = payload.status === 'ok' ? 200 : 503;
        res.status(statusCode).json(payload);
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Health check failed' });
    }
});

AppRoutes.init(app);

// 404 Error handler
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        status: 'failed',
        message: 'Route not found. Try with a vaid route',
        path: req.originalUrl
    });
});

app.use(errorHandler);

export default app;

