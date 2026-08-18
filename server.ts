import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { testSupabaseConnection } from './server/db';
import app from './server/app';
import { setupWebSocket } from './server/websocket';
import { seedAllData } from './server/seed';
import { validateEnv } from './server/env';
import { startPushScheduler } from './server/push-scheduler';

dotenv.config();

validateEnv();

const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN && SENTRY_DSN !== 'your-sentry-dsn') {
  import('@sentry/node').then(Sentry => {
    Sentry.init({ dsn: SENTRY_DSN, tracesSampleRate: 0.1 });
    console.log('[sentry] Error tracking initialized');
  }).catch(() => {
    console.warn('[sentry] Failed to initialize — errors will only be logged to console');
  });
}

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  await testSupabaseConnection();
  
  // Only seed in development or when SEED_DB=true
  if (process.env.NODE_ENV !== 'production' || process.env.SEED_DB === 'true') {
    await seedAllData();
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true,
      lastModified: true,
    }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const HOST = process.env.HOST || '0.0.0.0';
  const server = app.listen(PORT, HOST, () => {
    console.log(`AceMatric server running on http://${HOST}:${PORT}`);
  });

  setupWebSocket(server);
  startPushScheduler();

  let isShuttingDown = false;
  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\nShutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  setTimeout(() => process.exit(1), 1000);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => process.exit(1), 1000);
  }
});

startServer().catch((err) => {
  console.error('[FATAL] Server failed to start:', err);
  process.exit(1);
});
