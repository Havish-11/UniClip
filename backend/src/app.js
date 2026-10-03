import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { AppError } from './utils/errors.js';
import { sessionsRouter } from './routes/sessions.js';

export function createApp(hub) {
  const app = express();

  app.use(cors({ origin: config.corsOrigins.includes('*') ? true : config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  app.use('/api/sessions', sessionsRouter(hub));

  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } }));

  // Express 5 forwards async errors here automatically.
  app.use((err, _req, res, _next) => {
    if (err instanceof AppError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } });
    }
    console.error('[http] unexpected error:', err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal error' } });
  });

  return app;
}