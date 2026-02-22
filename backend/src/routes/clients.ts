import { Router, Response } from 'express';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { AuthRequest } from '../types.js';

const router = Router();

// GET /api/clients
router.get('/', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.roles.includes('admin');
  let rows;
  if (isAdmin) {
    rows = await query('SELECT * FROM public.clients ORDER BY name');
  } else {
    rows = await query(
      `SELECT c.* FROM public.clients c
       JOIN public.user_client_assignments a ON a.client_id = c.id
       WHERE a.user_id = $1 ORDER BY c.name`,
      [req.user!.id]
    );
  }
  res.json(rows);
});

// POST /api/clients  (admin)
router.post('/', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { name, contact_email, contact_name, address } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO public.clients (name, contact_email, contact_name, address)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, contact_email || null, contact_name || null, address || null]
  );
  res.status(201).json(row);
});

// PUT /api/clients/:id  (admin)
router.put('/:id', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { name, contact_email, contact_name, address } = req.body;
  await query(
    `UPDATE public.clients SET name=$1, contact_email=$2, contact_name=$3, address=$4 WHERE id=$5`,
    [name, contact_email || null, contact_name || null, address || null, req.params.id]
  );
  res.json({ success: true });
});

// DELETE /api/clients/:id  (admin)
router.delete('/:id', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  await query('DELETE FROM public.clients WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// ── Assignments (consultant ↔ client) ────────────────────────────

// GET /api/clients/assignments?userId=  (admin, or user_cra for own data)
router.get('/assignments', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.roles.includes('admin');
  const userId = isAdmin ? (req.query.userId as string | undefined) : req.user!.id;
  const params: any[] = [];
  const where = userId ? (params.push(userId), 'WHERE a.user_id = $1') : '';
  const rows = await query<any>(
    `SELECT a.*, c.name AS client_name,
            cv.name AS validator_name, cv.email AS validator_email
     FROM public.user_client_assignments a
     JOIN public.clients c ON c.id = a.client_id
     LEFT JOIN public.client_validators cv ON cv.id = a.default_validator_id
     ${where}
     ORDER BY c.name`,
    params
  );
  res.json(rows);
});

// POST /api/clients/assignments  (admin)
router.post('/assignments', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { user_id, client_id, mission_name, default_validator_id } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO public.user_client_assignments (user_id, client_id, mission_name, default_validator_id)
     VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, client_id) DO NOTHING RETURNING *`,
    [user_id, client_id, mission_name || null, default_validator_id || null]
  );
  res.status(201).json(row ?? { success: true });
});

// DELETE /api/clients/assignments/:id  (admin)
router.delete('/assignments/:id', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  await query('DELETE FROM public.user_client_assignments WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// ── Client validators ─────────────────────────────────────────────

// GET /api/clients/:id/validators
router.get('/:id/validators', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const rows = await query(
    'SELECT * FROM public.client_validators WHERE client_id = $1 ORDER BY created_at DESC',
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/clients/:id/validators
router.post('/:id/validators', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { name, email } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO public.client_validators (client_id, name, email) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, name, email]
  );
  res.status(201).json(row);
});

// DELETE /api/clients/validators/:id
router.delete('/validators/:id', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  await query('DELETE FROM public.client_validators WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

export default router;
