import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import routes from './routes.js';
import { initializeDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const port = Number(process.env.PORT) || 5000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Initialize TypeORM database
  await initializeDatabase();

  // Middleware
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'KAVARA API is running' });
  });
  
  // Connect all routes
  app.use(routes);

  if (isProduction) {
    // Production: serve static files
    app.use(express.static(path.join(__dirname, '../dist/public')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    });
  } else {
    // Development: integrate with Vite
    const { createServer: createViteServer } = await import('vite');
    
    const vite = await createViteServer({
      appType: 'custom',
      server: {
        middlewareMode: true,
        allowedHosts: true,
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
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 KAVARA server running on port ${port} (${isProduction ? 'production' : 'development'})`);
  });
}

createServer().catch(console.error);