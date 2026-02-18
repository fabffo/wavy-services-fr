import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// GET /api/trainings  (public)
router.get('/', async (req: Request, res: Response) => {
  const { status, slug } = req.query as any;
  let sql = `SELECT t.*, c.name AS category_name FROM public.trainings t
             LEFT JOIN public.categories c ON c.id = t.category_id WHERE 1=1`;
  const params: any[] = [];
  if (status) { params.push(status); sql += ` AND t.status = $${params.length}`; }
  if (slug) { params.push(slug); sql += ` AND t.slug = $${params.length}`; }
  sql += ' ORDER BY t.created_at DESC';
  res.json(await query(sql, params));
});

// GET /api/trainings/categories  (public)
router.get('/categories', async (_req: Request, res: Response) => {
  res.json(await query(`SELECT * FROM public.categories WHERE type = 'formation' ORDER BY name`));
});

// POST /api/trainings  (admin)
router.post('/', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const d = req.body;
  const row = await queryOne<any>(
    `INSERT INTO public.trainings (title, slug, modality, category_id, duration_hours, price,
       description_html, goals_html, program_html, prerequisites_html, audience_html, status, featured,
       published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [d.title, d.slug, d.modality, d.category_id || null, d.duration_hours || null, d.price || null,
     d.description_html, d.goals_html, d.program_html, d.prerequisites_html, d.audience_html,
     d.status ?? 'draft', d.featured ?? false,
     d.status === 'published' ? new Date().toISOString() : null]
  );
  res.status(201).json(row);
});

// PUT /api/trainings/:id  (admin)
router.put('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const d = req.body;
  await query(
    `UPDATE public.trainings SET title=$1,slug=$2,modality=$3,category_id=$4,duration_hours=$5,price=$6,
       description_html=$7,goals_html=$8,program_html=$9,prerequisites_html=$10,audience_html=$11,
       status=$12,featured=$13,published_at=$14,updated_at=NOW() WHERE id=$15`,
    [d.title, d.slug, d.modality, d.category_id || null, d.duration_hours || null, d.price || null,
     d.description_html, d.goals_html, d.program_html, d.prerequisites_html, d.audience_html,
     d.status, d.featured, d.status === 'published' ? new Date().toISOString() : null, req.params.id]
  );
  res.json({ success: true });
});

// DELETE /api/trainings/:id  (admin)
router.delete('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  await query('DELETE FROM public.trainings WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

export default router;
