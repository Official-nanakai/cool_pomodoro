import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import timerRouter from './routes/timer.js';
import statsRouter from './routes/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({ origin: isProd ? false : CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/timer', timerRouter);
app.use('/api/stats', statsRouter);

// In production: serve the built React app
if (isProd) {
  const staticDir = path.join(__dirname, '../../client/dist');
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [${isProd ? 'production' : 'dev'}]`);
});
