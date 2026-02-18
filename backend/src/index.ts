import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import authRouter from './routes/auth.js';
import otpRouter from './routes/otp.js';
import usersRouter from './routes/users.js';
import jobsRouter from './routes/jobs.js';
import trainingsRouter from './routes/trainings.js';
import contentRouter from './routes/content.js';
import clientsRouter from './routes/clients.js';
import craRouter from './routes/cra.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000');
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:8080';

// ── Security ──────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:8080', 'http://localhost:5173'], credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '10mb' }));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// Edge Functions compatibility (send-otp / verify-otp)
app.use('/api/functions/send-otp', (req, res, next) => { req.url = '/send'; next(); }, otpRouter);
app.use('/api/functions/verify-otp', (req, res, next) => { req.url = '/verify'; next(); }, otpRouter);

// Edge Functions compatibility (CRA)
app.use('/api/functions/send-cra-validation', (req, res, next) => { req.url = '/send-validation'; next(); }, craRouter);
app.use('/api/functions/validate-cra', (req, res, next) => { req.url = '/validate'; next(); }, craRouter);

// Edge Functions compatibility (create-user)
app.use('/api/functions/create-user', (req, res, next) => { req.url = '/create'; next(); }, usersRouter);

app.use('/api/users', usersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/trainings', trainingsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/cra', craRouter);

// Content routes (applications, training-leads, contact, upload, stats)
app.use('/api', contentRouter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Generic DB router (QueryBuilder support) ──────────────────────
// This handles calls from the frontend QueryBuilder: /api/db/:table
import { pool } from './db.js';
import { requireAuth } from './middleware/auth.js';
import { AuthRequest } from './types.js';

const ALLOWED_TABLES: Record<string, { read: string[]; write: string[] }> = {
  jobs:              { read: ['*'], write: ['admin'] },
  trainings:         { read: ['*'], write: ['admin'] },
  categories:        { read: ['*'], write: ['admin'] },
  applications:      { read: ['admin'], write: ['*'] },
  training_leads:    { read: ['admin'], write: ['*'] },
  contact_messages:  { read: ['admin'], write: ['*'] },
  profiles:          { read: ['admin', 'user_cra', 'self'], write: ['admin', 'self'] },
  user_roles:        { read: ['admin', 'user_cra', 'self'], write: ['admin'] },
  user_invitations:  { read: ['*'], write: ['*'] },
  clients:           { read: ['admin', 'user_cra'], write: ['admin'] },
  client_validators: { read: ['admin'], write: ['admin'] },
  user_client_assignments: { read: ['admin', 'user_cra'], write: ['admin'] },
  cra_reports:       { read: ['admin', 'user_cra'], write: ['admin', 'user_cra'] },
  cra_day_details:   { read: ['admin', 'user_cra'], write: ['admin', 'user_cra'] },
  otp_codes:         { read: [], write: [] }, // never via generic
};

function parseFilters(query: Record<string, any>): { where: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  for (const [key, val] of Object.entries(query)) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
    // Format: col=eq.value
    const eqMatch = String(val).match(/^eq\.(.+)$/);
    const neqMatch = String(val).match(/^neq\.(.+)$/);
    const gtMatch = String(val).match(/^gt\.(.+)$/);
    const ltMatch = String(val).match(/^lt\.(.+)$/);
    const col = key.replace(/[^a-zA-Z0-9_]/g, '');

    if (eqMatch) { params.push(decodeURIComponent(eqMatch[1])); conditions.push(`${col} = $${params.length}`); }
    else if (neqMatch) { params.push(decodeURIComponent(neqMatch[1])); conditions.push(`${col} != $${params.length}`); }
    else if (gtMatch) { params.push(decodeURIComponent(gtMatch[1])); conditions.push(`${col} > $${params.length}`); }
    else if (ltMatch) { params.push(decodeURIComponent(ltMatch[1])); conditions.push(`${col} < $${params.length}`); }
  }
  return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
}

app.all('/api/db/:table', requireAuth, async (req: AuthRequest, res) => {
  const table = String(req.params.table);
  if (!(table in ALLOWED_TABLES)) { res.status(403).json({ error: 'Table non autorisée' }); return; }

  try {
    const { where, params } = parseFilters(req.query as any);
    const orderRaw = (req.query.order as string | undefined)?.match(/^([a-z_]+):(asc|desc)$/i);
    const order = orderRaw ? `ORDER BY ${orderRaw[1]} ${orderRaw[2].toUpperCase()}` : '';
    const limit = req.query.limit ? `LIMIT ${parseInt(req.query.limit as string)}` : '';

    if (req.method === 'GET') {
      const { rows } = await pool.query(
        `SELECT * FROM public.${table} ${where} ${order} ${limit}`,
        params
      );
      res.json(rows);
    } else if (req.method === 'POST') {
      const keys = Object.keys(req.body).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
      const vals = keys.map(k => req.body[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`);
      const { rows } = await pool.query(
        `INSERT INTO public.${table} (${keys.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`,
        vals
      );
      res.status(201).json(rows[0]);
    } else if (req.method === 'PATCH') {
      const keys = Object.keys(req.body).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const vals = [...keys.map(k => req.body[k]), ...params];
      const { rows } = await pool.query(
        `UPDATE public.${table} SET ${setClause}, updated_at = NOW()
         ${where.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + keys.length}`)}
         RETURNING *`,
        vals
      );
      res.json(rows[0] ?? null);
    } else if (req.method === 'DELETE') {
      await pool.query(`DELETE FROM public.${table} ${where}`, params);
      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Méthode non supportée' });
    }
  } catch (err: any) {
    console.error(`DB error [${table}]:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Error handler ──────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'Erreur serveur' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend Wavy Services démarré sur http://0.0.0.0:${PORT}`);
});
