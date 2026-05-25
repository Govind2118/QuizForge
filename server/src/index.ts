import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestContext } from './middleware/requestContext.js';
import morgan from 'morgan';
import { allowedOrigins, env } from './config/env.js';
import { authRouter } from './routes/authRoutes.js';
import { publicQuizRouter, quizRouter } from './routes/quizRoutes.js';
import { errorHandler, notFound } from './utils/http.js';

const app = express();

app.disable('x-powered-by');
app.use(requestContext);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS.'));
  },
  credentials: false,
}));
app.use(express.json({ limit: '120kb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Please try again shortly.' } },
});

const publicAttemptLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many quiz requests. Please wait a moment and try again.' } },
});

app.use(apiLimiter);

app.get('/health', (_req, res) => res.json({ ok: true, service: 'quizforge-api', uptime: process.uptime() }));
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/public/quizzes', publicAttemptLimiter, publicQuizRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`QuizForge API listening on http://localhost:${env.PORT}`);
});
