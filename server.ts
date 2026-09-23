import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { predict } from './api/_space.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API route for toxicity inference
app.post('/api/inference', async (req, res) => {
  try {
    const { text, model } = req.body;
    if (!text || !model) {
      return res.status(400).json({ error: 'Text and model parameters are required' });
    }
    if (typeof text !== 'string' || text.length > 2000) {
      return res.status(400).json({ error: 'Text must be a string of at most 2000 characters' });
    }

    res.json(await predict(text, model));
  } catch (err: any) {
    console.error('Inference error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Serve frontend static assets or run Vite dev server
const isProd = process.env.NODE_ENV === 'production' || __dirname.includes('dist');

if (isProd) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // In development, run Vite as middleware
  const vite = await import('vite');
  const viteServer = await vite.createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(viteServer.middlewares);
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
