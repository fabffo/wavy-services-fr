import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { AuthRequest } from '../types.js';
import { sendEmail } from '../services/email.js';

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:8080';

// GET /api/users — admin only
router.get('/', requireAuth, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  const users = await query<any>(
    `SELECT p.id, p.email, p.full_name, p.created_at,
            ARRAY_AGG(ur.role::text) FILTER (WHERE ur.role IS NOT NULL) AS roles
     FROM public.profiles p
     LEFT JOIN public.user_roles ur ON ur.user_id = p.id
     GROUP BY p.id, p.email, p.full_name, p.created_at
     ORDER BY p.created_at DESC`
  );
  res.json(users);
});

// POST /api/users/create — create user (admin only, replaces create-user Edge Function)
router.post('/create', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { email, password, role } = req.body;
  if (!email || !password) { res.status(400).json({ error: 'Email et mot de passe requis' }); return; }

  const existing = await queryOne('SELECT id FROM auth.users WHERE email = $1', [email]);
  if (existing) { res.status(409).json({ error: 'Email déjà utilisé' }); return; }

  const hashed = await bcrypt.hash(password, 12);
  const userId = uuidv4();

  await query(
    `INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at,
       confirmation_token, recovery_token, email_change_token_new, email_change)
     VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, $3, NOW(),
       '{"provider":"email","providers":["email"]}', '{}',
       'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '')`,
    [userId, email, hashed]
  );

  await query(
    `INSERT INTO public.profiles (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
    [userId, email]
  );

  if (role && role !== 'user') {
    await query(
      `INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, role]
    );
  }

  res.status(201).json({ user: { id: userId, email } });
});

// DELETE /api/users/:id/roles/:role — admin only
router.delete('/:id/roles/:role', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  await query('DELETE FROM public.user_roles WHERE user_id = $1 AND role = $2', [req.params.id, req.params.role]);
  res.json({ success: true });
});

// ── Invitations ───────────────────────────────────────────────────

// GET /api/invitations?token=xxx
router.get('/invitations', async (req: AuthRequest, res: Response) => {
  const { token } = req.query as { token?: string };
  if (!token) { res.status(400).json({ error: 'Token requis' }); return; }

  const inv = await queryOne<any>(
    `SELECT * FROM public.user_invitations WHERE token = $1 AND status = 'pending'`,
    [token]
  );

  if (!inv || new Date(inv.expires_at) < new Date()) {
    res.status(404).json({ error: 'Invitation invalide ou expirée' });
    return;
  }
  res.json(inv);
});

// GET /api/invitations — admin: list all
router.get('/invitations/all', requireAuth, requireRole('admin'), async (_req, res: Response) => {
  const rows = await query<any>(`SELECT * FROM public.user_invitations ORDER BY created_at DESC`);
  res.json(rows);
});

// POST /api/invitations — create invitation (admin)
router.post('/invitations', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { email, first_name, last_name } = req.body;
  if (!email) { res.status(400).json({ error: 'Email requis' }); return; }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7j

  const inv = await queryOne<any>(
    `INSERT INTO public.user_invitations (email, first_name, last_name, token, status, expires_at, invited_by)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6) RETURNING *`,
    [email, first_name, last_name, token, expiresAt.toISOString(), req.user!.id]
  );

  const inviteUrl = `${FRONTEND_URL}/cra/auth?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Invitation à rejoindre l'espace CRA - Wavy Services",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2>Bienvenue chez Wavy Services</h2>
        <p>Bonjour ${first_name ?? ''},</p>
        <p>Vous avez été invité(e) à rejoindre l'espace CRA de Wavy Services.</p>
        <a href="${inviteUrl}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:16px 0;">
          Créer mon compte
        </a>
        <p style="color:#666;font-size:12px;">Ce lien expire dans 7 jours.</p>
      </div>
    `,
  });

  res.status(201).json(inv);
});

// PUT /api/invitations/:id — accept invitation
router.put('/invitations/:id', async (req: AuthRequest, res: Response) => {
  const { status, accepted_at } = req.body;
  await query(
    `UPDATE public.user_invitations SET status = $1, accepted_at = $2 WHERE id = $3 AND status = 'pending'`,
    [status, accepted_at, req.params.id]
  );
  res.json({ success: true });
});

// POST /api/users/:id/roles — assign role
router.post('/:id/roles', async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  await query(
    `INSERT INTO public.user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [req.params.id, role]
  );
  res.json({ success: true });
});

export default router;
