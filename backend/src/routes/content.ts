import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer, { StorageEngine } from 'multer';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// ── Applications (candidatures) ───────────────────────────────────

// POST /api/applications  (public)
router.post('/applications', async (req: Request, res: Response) => {
  const { job_id, name, email, phone, message, cv_url } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO public.applications (job_id, name, email, phone, message, cv_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [job_id, name, email, phone || null, message || null, cv_url || null]
  );
  res.status(201).json(row);
});

// GET /api/applications  (admin)
router.get('/applications', requireAuth, requireRole('admin'), async (_req: Request, res: Response) => {
  const rows = await query<any>(
    `SELECT a.*, j.title AS job_title FROM public.applications a
     LEFT JOIN public.jobs j ON j.id = a.job_id
     ORDER BY a.created_at DESC`
  );
  res.json(rows);
});

// ── Training leads ────────────────────────────────────────────────

// POST /api/training-leads  (public)
router.post('/training-leads', async (req: Request, res: Response) => {
  const { training_id, name, email, phone, company, message } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO public.training_leads (training_id, name, email, phone, company, message)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [training_id, name, email, phone || null, company || null, message || null]
  );
  res.status(201).json(row);
});

// GET /api/training-leads  (admin)
router.get('/training-leads', requireAuth, requireRole('admin'), async (_req: Request, res: Response) => {
  const rows = await query<any>(
    `SELECT tl.*, t.title AS training_title FROM public.training_leads tl
     LEFT JOIN public.trainings t ON t.id = tl.training_id
     ORDER BY tl.created_at DESC`
  );
  res.json(rows);
});

// ── Contact messages ──────────────────────────────────────────────

// POST /api/contact  (public)
router.post('/contact', async (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO public.contact_messages (name, email, phone, subject, message)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [name, email, phone || null, subject || null, message]
  );
  res.status(201).json(row);
});

// ── CV Upload ─────────────────────────────────────────────────────

const uploadsDir = path.join(process.cwd(), 'uploads', 'cvs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage: StorageEngine = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadsDir),
  filename: (_req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Extend Request type for multer
declare module 'express-serve-static-core' {
  interface Request { file?: Express.Multer.File; }
}

// POST /api/upload  (public — CV from job application)
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'Aucun fichier' }); return; }
  res.json({ path: req.file.filename });
});

// GET /api/uploads/cvs/:filename  (admin)
router.get('/uploads/cvs/:filename', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const filePath = path.join(uploadsDir, String(req.params.filename));
  if (!fs.existsSync(filePath)) { res.status(404).json({ error: 'Fichier introuvable' }); return; }
  res.sendFile(filePath);
});

// ── Stats dashboard ───────────────────────────────────────────────

// GET /api/stats  (admin)
router.get('/stats', requireAuth, requireRole('admin'), async (_req: Request, res: Response) => {
  const [jobs, trainings, applications, leads, cra] = await Promise.all([
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM public.jobs'),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM public.trainings'),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM public.applications'),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM public.training_leads'),
    queryOne<{ count: string }>("SELECT COUNT(*) as count FROM public.cra_reports WHERE status = 'submitted'"),
  ]);
  res.json({
    jobs: parseInt(jobs?.count ?? '0'),
    trainings: parseInt(trainings?.count ?? '0'),
    applications: parseInt(applications?.count ?? '0'),
    training_leads: parseInt(leads?.count ?? '0'),
    pending_cra: parseInt(cra?.count ?? '0'),
  });
});

export default router;
