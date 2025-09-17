import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist/public')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KAVARA API is running' });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 KAVARA server running on port ${port}`);
});