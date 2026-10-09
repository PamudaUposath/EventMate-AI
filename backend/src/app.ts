import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { eventsHandler } from './handlers/eventsHandler.js';
import { tasksHandler } from './handlers/tasksHandler.js';
import { agentHandler } from './handlers/agentHandler.js';
import { rescueHandler } from './handlers/rescueHandler.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration (Configurable with fallback to localhost and Amplify domains)
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy'));
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
      maxAge: 86400,
    })
  );

  // 3. Request body size limit (Prevent large payload DoS)
  app.use(express.json({ limit: '100kb' }));

  // 4. Rate Limiting Middleware
  // General API rate limiter
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'TooManyRequests',
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  });

  // Dedicated stricter rate limiter for costly AI / Bedrock endpoints
  const aiBedrockLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // max 30 Bedrock agent invocations per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'TooManyRequests',
      message: 'EventMate AI rate limit reached. Please wait a short while before sending further requests.',
    },
  });

  app.use(generalLimiter);

  // Public Health Endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'EventMate AI Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Protected Routes
  const router = express.Router();
  router.use(authMiddleware as any);

  // Events API
  router.get('/events', eventsHandler.list as any);
  router.post('/events', eventsHandler.create as any);
  router.get('/events/:eventId', eventsHandler.getOne as any);
  router.patch('/events/:eventId', eventsHandler.update as any);
  router.delete('/events/:eventId', eventsHandler.delete as any);
  router.get('/events/:eventId/progress', eventsHandler.getProgress as any);

  // Tasks API
  router.get('/events/:eventId/tasks', tasksHandler.list as any);
  router.post('/events/:eventId/tasks', tasksHandler.create as any);
  router.patch('/events/:eventId/tasks/:taskId', tasksHandler.update as any);
  router.delete('/events/:eventId/tasks/:taskId', tasksHandler.delete as any);

  // AI Agent API (Protected with AI rate limiter)
  router.post('/agent/chat', aiBedrockLimiter as any, agentHandler.chat as any);
  router.get('/events/:eventId/messages', agentHandler.getMessages as any);

  // Plan Rescue API (Protected with AI rate limiter)
  router.post('/events/:eventId/rescue', aiBedrockLimiter as any, rescueHandler.propose as any);
  router.post('/events/:eventId/rescue/:proposalId/apply', rescueHandler.apply as any);
  router.get('/events/:eventId/rescue', rescueHandler.list as any);

  app.use(router);

  // Global Error Handler
  app.use(errorHandler as any);

  return app;
}
