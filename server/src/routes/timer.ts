import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/start', (req: AuthRequest, res: Response) => {
  const { taskId } = req.body as { taskId?: number };
  if (!taskId) {
    res.status(400).json({ error: 'taskId required' });
    return;
  }
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.userId!);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  db.prepare(
    `UPDATE time_entries SET ended_at = ? WHERE user_id = ? AND ended_at IS NULL`
  ).run(Math.floor(Date.now() / 1000), req.userId!);

  const result = db.prepare(
    'INSERT INTO time_entries (task_id, user_id, started_at) VALUES (?, ?, ?)'
  ).run(taskId, req.userId!, Math.floor(Date.now() / 1000));

  res.status(201).json({ entryId: Number(result.lastInsertRowid) });
});

router.post('/stop', (req: AuthRequest, res: Response) => {
  const { taskId } = req.body as { taskId?: number };
  const now = Math.floor(Date.now() / 1000);
  if (taskId) {
    db.prepare(
      `UPDATE time_entries SET ended_at = ? WHERE user_id = ? AND task_id = ? AND ended_at IS NULL`
    ).run(now, req.userId!, taskId);
  } else {
    db.prepare(
      `UPDATE time_entries SET ended_at = ? WHERE user_id = ? AND ended_at IS NULL`
    ).run(now, req.userId!);
  }
  res.json({ ok: true });
});

router.get('/active', (req: AuthRequest, res: Response) => {
  const active = db.prepare(
    `SELECT te.id as entryId, te.task_id as taskId, te.started_at as startedAt
     FROM time_entries te
     WHERE te.user_id = ? AND te.ended_at IS NULL`
  ).all(req.userId!);
  res.json(active);
});

export default router;
