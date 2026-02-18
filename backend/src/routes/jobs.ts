import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// GET /api/jobs  (public)
router.get('/', async (req: Request, res: Response) => {
  const { status, slug, featured } = req.query as any;
  let sql = 'SELECT * FROM public.jobs WHERE 1=1';
  const params: any[] = [];

  if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
  if (slug) { params.push(slug); sql += ` AND slug = $${params.length}`; }
  if (featured) { sql += ' AND featured = true'; }

  sql += ' ORDER BY created_at DESC';

  const rows = await query(sql, params);
  res.json(rows);
});

// POST /api/jobs  (admin)
router.post('/', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const d = req.body;
  const row = await queryOne<any>(
    `INSERT INTO public.jobs (title, slug, description_html, contract_type, location, domain,
       experience, salary, status, featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [d.title, d.slug, d.description_html, d.contract_type, d.location,
     d.domain, d.experience, d.salary, d.status ?? 'draft', d.featured ?? false]
  );
  res.status(201).json(row);
});

// PUT /api/jobs/:id  (admin)
router.put('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const d = req.body;
  await query(
    `UPDATE public.jobs SET title=$1,slug=$2,description_html=$3,contract_type=$4,location=$5,
       domain=$6,experience=$7,salary=$8,status=$9,featured=$10,updated_at=NOW()
     WHERE id=$11`,
    [d.title, d.slug, d.description_html, d.contract_type, d.location,
     d.domain, d.experience, d.salary, d.status, d.featured, req.params.id]
  );
  res.json({ success: true });
});

// DELETE /api/jobs/:id  (admin)
router.delete('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  await query('DELETE FROM public.jobs WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

export default router;
