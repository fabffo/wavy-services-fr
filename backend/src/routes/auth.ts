import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db.js';
import { generateToken, requireAuth, loadUserRoles } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';
import { sendEmail } from '../services/email.js';

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:8080';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' });
    return;
  }

  const user = await queryOne<{ id: string; email: string; encrypted_password: string }>(
    `SELECT id, email, encrypted_password FROM auth.users WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  if (!user) {
    res.status(401).json({ error: 'Identifiants invalides' });
    return;
  }

  const valid = await bcrypt.compare(password, user.encrypted_password);
  if (!valid) {
    res.status(401).json({ error: 'Identifiants invalides' });
    return;
  }

  const roles = await loadUserRoles(user.id);
  const authUser = { id: user.id, email: user.email, role: roles[0] ?? 'user', roles };
  const token = generateToken(authUser);

  res.json({ token, user: authUser });
});

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, metadata } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis' });
    return;
  }

  const existing = await queryOne('SELECT id FROM auth.users WHERE email = $1', [email]);
  if (existing) {
    res.status(409).json({ error: 'Cet email est déjà utilisé' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  const fullName: string = metadata?.full_name ?? '';

  await query(
    `INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at,
       confirmation_token, recovery_token, email_change_token_new, email_change)
     VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, $3, NOW(),
       '{"provider":"email","providers":["email"]}', $4,
       'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '')`,
    [userId, email, hashedPassword, JSON.stringify({ full_name: fullName })]
  );

  await query(
    `INSERT INTO public.profiles (id, email, full_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
    [userId, email, fullName]
  );

  const roles = await loadUserRoles(userId);
  const authUser = { id: userId, email, role: roles[0] ?? 'user', roles };

  res.status(201).json({ user: authUser });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await queryOne<{ id: string; email: string }>(
    `SELECT u.id, u.email FROM auth.users u WHERE u.id = $1`,
    [req.user!.id]
  );
  if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }
  const roles = await loadUserRoles(user.id);
  res.json({ id: user.id, email: user.email, role: roles[0] ?? 'user', roles });
});

// POST /api/auth/reset-password  (envoi email reset)
router.post('/reset-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: 'Email requis' }); return; }

  const user = await queryOne<{ id: string }>('SELECT id FROM auth.users WHERE email = $1', [email]);
  if (!user) {
    res.json({ success: true }); // security: don't reveal if email exists
    return;
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await query(
    `INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [user.id, token, expiresAt.toISOString()]
  );

  const resetUrl = `${FRONTEND_URL}/auth?reset=${token}`;
  await sendEmail({
    to: email,
    subject: 'Réinitialisation de mot de passe - Wavy Services',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:16px 0;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#666;font-size:12px;">Ce lien expire dans 1 heure.</p>
      </div>
    `,
  });

  res.json({ success: true });
});

// POST /api/auth/reset-password-confirm
router.post('/reset-password-confirm', async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) { res.status(400).json({ error: 'Token et mot de passe requis' }); return; }

  const row = await queryOne<{ user_id: string; expires_at: string }>(
    `SELECT user_id, expires_at FROM public.password_reset_tokens WHERE token = $1`,
    [token]
  );

  if (!row || new Date(row.expires_at) < new Date()) {
    res.status(400).json({ error: 'Token invalide ou expiré' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await query('UPDATE auth.users SET encrypted_password = $1 WHERE id = $2', [hashedPassword, row.user_id]);
  await query('DELETE FROM public.password_reset_tokens WHERE user_id = $1', [row.user_id]);

  res.json({ success: true });
});

export default router;
