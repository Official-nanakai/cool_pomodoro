import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthRequest, res: Response) => {
  const tasks = db.prepare(
    `SELECT id, name, color, status, created_at FROM tasks WHERE user_id = ? ORDER BY created_at ASC`
  ).all(req.userId!);
  res.json(tasks);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name, color } = req.body as { name?: string; color?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Name required' });
    return;
  }
  const result = db.prepare(
    'INSERT INTO tasks (user_id, name, color) VALUES (?, ?, ?)'
  ).run(req.userId!, name.trim(), color ?? '#6366f1');
  const task = db.prepare('SELECT id, name, color, status, created_at FROM tasks WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json(task);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { name, color, status } = req.body as { name?: string; color?: string; status?: string };
  const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!);
  if (!task) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (name !== undefined) {
    db.prepare('UPDATE tasks SET name = ? WHERE id = ?').run(name.trim(), req.params.id);
  }
  if (color !== undefined) {
    db.prepare('UPDATE tasks SET color = ? WHERE id = ?').run(color, req.params.id);
  }
  if (status !== undefined && ['active', 'archived'].includes(status)) {
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, req.params.id);
  }
  const updated = db.prepare('SELECT id, name, color, status, created_at FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId!);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
