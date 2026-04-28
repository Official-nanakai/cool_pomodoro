import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req: AuthRequest, res: Response) => {
  const from = parseInt(req.query.from as string);
  const to = parseInt(req.query.to as string);

  if (isNaN(from) || isNaN(to)) {
    res.status(400).json({ error: 'from and to (unix timestamps) required' });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const uid = req.userId!;

  const rows = db.prepare(
    `SELECT
       t.id,
       t.name,
       t.color,
       t.status,
       COALESCE(SUM(
         CASE
           WHEN te.ended_at IS NOT NULL
             THEN MIN(te.ended_at, ?) - MAX(te.started_at, ?)
           ELSE ? - MAX(te.started_at, ?)
         END
       ), 0) AS total_seconds
     FROM tasks t
     LEFT JOIN time_entries te
       ON te.task_id = t.id
       AND te.started_at < ?
       AND (te.ended_at IS NULL OR te.ended_at > ?)
     WHERE t.user_id = ?
     GROUP BY t.id
     ORDER BY total_seconds DESC`
  ).all(to, from, now, from, to, from, uid);

  const daily = db.prepare(
    `SELECT
       t.id as taskId,
       t.name,
       t.color,
       date(MAX(te.started_at, ?), 'unixepoch') as day,
       SUM(
         CASE
           WHEN te.ended_at IS NOT NULL
             THEN MIN(te.ended_at, ?) - MAX(te.started_at, ?)
           ELSE ? - MAX(te.started_at, ?)
         END
       ) AS seconds
     FROM time_entries te
     JOIN tasks t ON t.id = te.task_id
     WHERE te.user_id = ?
       AND te.started_at < ?
       AND (te.ended_at IS NULL OR te.ended_at > ?)
     GROUP BY t.id, day
     ORDER BY day ASC`
  ).all(from, to, from, now, from, uid, to, from);

  res.json({ totals: rows, daily });
});

export default router;
