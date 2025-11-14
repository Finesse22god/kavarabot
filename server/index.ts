import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import routes from './routes.js';
import { register1CRoutes } from "./routes-1c";
import { initializeDatabase } from './database.js';
import { setupTelegramBotWithApp } from './telegram.js';
import { migrateImagesToS3 } from './migrate-images-to-s3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global database initialization state
let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

async function initializeDatabaseLazy() {
  if (dbInitialized) return;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = initializeDatabase().then(async () => {
    dbInitialized = true;
    console.log('✅ Database initialization completed');
    
    // Запускаем миграцию фото в S3 (только при первом деплое на Timeweb)
    try {
      await migrateImagesToS3();
    } catch (error) {
      console.error('⚠️  Миграция фото в S3 завершилась с ошибками (не критично):', error);
    }
  }).catch((error) => {
    console.error('❌ Database initialization failed:', error);
    dbInitPromise = null; // Allow retry
    throw error;
  });

  return dbInitPromise;
}

async function createServer() {
  const app = express();
  const port = Number(process.env.PORT) || 5000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Start database initialization in background (non-blocking)
  initializeDatabaseLazy().catch(console.error);

  // Middleware - увеличиваем лимиты для загрузки файлов
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check endpoints - must be before database initialization
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      message: 'KAVARA server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      message: 'KAVARA API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Readiness check - simple endpoint for deployment health checks
  app.get('/ready', (req, res) => {
    res.status(200).send('OK');
  });

  // Database readiness check
  app.get('/db-ready', async (req, res) => {
    try {
      if (dbInitialized) {
        res.status(200).json({ status: 'ready', message: 'Database is initialized' });
      } else {
        // Try to initialize if not already done
        await initializeDatabaseLazy();
        res.status(200).json({ status: 'ready', message: 'Database initialized successfully' });
      }
    } catch (error) {
      res.status(503).json({ 
        status: 'not_ready', 
        message: 'Database initialization failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Setup Telegram bot webhook (must be before catch-all routes)
  setupTelegramBotWithApp(app);

  // ОТКЛЮЧЕНА автоматическая настройка webhook при старте сервера
  // Это предотвращает случайную перезапись production webhook на development URL
  // Для настройки webhook вручную откройте: https://finesse22god-kavarabot-e967.twc1.net/setup-bot
  console.log('ℹ️  Автонастройка webhook ОТКЛЮЧЕНА');
  console.log('   Для настройки webhook откройте: https://finesse22god-kavarabot-e967.twc1.net/setup-bot');

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  // Connect all routes
  app.use(routes);

  // Подключение API endpoints для 1С
  register1CRoutes(app);

  if (isProduction) {
    // Production: serve static files with proper cache control
    app.use(express.static(path.join(__dirname, '../dist/public'), {
      setHeaders: (res, filepath) => {
        // Disable caching for HTML files to prevent stale content
        if (filepath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else if (filepath.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
          // Cache other static assets for 1 hour
          res.setHeader('Cache-Control', 'public, max-age=3600');
        }
      }
    }));

    app.get('*', (req, res) => {
      // Always send fresh HTML with no-cache headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    });
  } else {
    // Development: integrate with Vite
    const { createServer: createViteServer } = await import('vite');

    // Create HTTP server first
    const server = http.createServer(app);

    const vite = await createViteServer({
      appType: 'custom',
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          server: server,
        },
      },
    });

    app.use(vite.middlewares);

    // Serve HTML for all other routes
    const indexHtmlPath = path.resolve(__dirname, '../client/index.html');
    app.use('*', async (req, res, next) => {
      try {
        let html = await fs.readFile(indexHtmlPath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({'Content-Type': 'text/html'}).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 KAVARA server running on port ${port} (${isProduction ? 'production' : 'development'})`);
    });
    
    return;
  }

  // Production: use standard Express listen
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 KAVARA server running on port ${port} (${isProduction ? 'production' : 'development'})`);
  });
}

createServer().catch(console.error);