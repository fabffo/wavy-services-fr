import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { AuthRequest } from '../types.js';
import { sendEmail } from '../services/email.js';
import { generateCraPdf } from '../services/pdf.js';

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:8080';

// GET /api/cra — list CRA reports
router.get('/', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.roles.includes('admin');
  let rows;
  if (isAdmin) {
    rows = await query<any>(
      `SELECT r.*, p.email AS consultant_email, p.full_name AS consultant_name,
              c.name AS client_name
       FROM public.cra_reports r
       LEFT JOIN public.profiles p ON p.id = r.user_id
       LEFT JOIN public.clients c ON c.id = r.client_id
       ORDER BY r.created_at DESC`
    );
  } else {
    rows = await query<any>(
      `SELECT r.*, c.name AS client_name
       FROM public.cra_reports r
       LEFT JOIN public.clients c ON c.id = r.client_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user!.id]
    );
  }
  res.json(rows);
});

// GET /api/cra/:id
router.get('/:id', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.roles.includes('admin');
  const row = await queryOne<any>(
    `SELECT r.*, p.email AS consultant_email, p.full_name AS consultant_name, c.name AS client_name
     FROM public.cra_reports r
     LEFT JOIN public.profiles p ON p.id = r.user_id
     LEFT JOIN public.clients c ON c.id = r.client_id
     WHERE r.id = $1 ${isAdmin ? '' : 'AND r.user_id = $2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user!.id]
  );
  if (!row) { res.status(404).json({ error: 'CRA introuvable' }); return; }
  res.json(row);
});

// POST /api/cra — create CRA
router.post('/', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const { month, client_id, company_name, worked_days, absent_days, monthly_comment } = req.body;
  const userId = req.user!.id;

  // Check existing CRA for same month/user
  const existing = await queryOne(
    'SELECT id FROM public.cra_reports WHERE user_id = $1 AND month = $2',
    [userId, month]
  );
  if (existing) { res.status(409).json({ error: 'Un CRA existe déjà pour ce mois' }); return; }

  const row = await queryOne<any>(
    `INSERT INTO public.cra_reports
       (user_id, month, client_id, company_name, worked_days, absent_days, monthly_comment, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'draft') RETURNING *`,
    [userId, month, client_id || null, company_name || null,
     worked_days ?? 0, absent_days ?? 0, monthly_comment || null]
  );
  res.status(201).json(row);
});

// PUT /api/cra/:id — update CRA
router.put('/:id', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const { client_id, company_name, worked_days, absent_days, monthly_comment, status, admin_comment } = req.body;
  const isAdmin = req.user!.roles.includes('admin');

  let sql: string;
  let params: any[];

  if (isAdmin) {
    sql = `UPDATE public.cra_reports SET client_id=$1,company_name=$2,worked_days=$3,absent_days=$4,
            monthly_comment=$5,status=$6,admin_comment=$7,updated_at=NOW() WHERE id=$8`;
    params = [client_id || null, company_name || null, worked_days, absent_days,
              monthly_comment || null, status, admin_comment || null, req.params.id];
  } else {
    sql = `UPDATE public.cra_reports SET client_id=$1,company_name=$2,worked_days=$3,absent_days=$4,
            monthly_comment=$5,updated_at=NOW() WHERE id=$6 AND user_id=$7 AND status='draft'`;
    params = [client_id || null, company_name || null, worked_days, absent_days,
              monthly_comment || null, req.params.id, req.user!.id];
  }
  await query(sql, params);
  res.json({ success: true });
});

// PUT /api/cra/:id/submit — submit for validation
router.put('/:id/submit', requireAuth, requireRole('user_cra'), async (req: AuthRequest, res: Response) => {
  await query(
    `UPDATE public.cra_reports SET status='submitted', updated_at=NOW()
     WHERE id=$1 AND user_id=$2 AND status='draft'`,
    [req.params.id, req.user!.id]
  );
  res.json({ success: true });
});

// ── Day details ───────────────────────────────────────────────────

// GET /api/cra/:id/days
router.get('/:id/days', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const rows = await query(
    'SELECT * FROM public.cra_day_details WHERE cra_report_id = $1 ORDER BY date',
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/cra/:id/days — upsert day details
router.post('/:id/days', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const days: Array<{ date: string; state: string; comment?: string }> = req.body;
  if (!Array.isArray(days)) { res.status(400).json({ error: 'Array de jours requis' }); return; }

  // Delete existing days and re-insert
  await query('DELETE FROM public.cra_day_details WHERE cra_report_id = $1', [req.params.id]);

  for (const day of days) {
    await query(
      `INSERT INTO public.cra_day_details (cra_report_id, date, state, comment)
       VALUES ($1,$2,$3,$4)`,
      [req.params.id, day.date, day.state, day.comment || null]
    );
  }
  res.json({ success: true });
});

// ── Send validation email to client ──────────────────────────────

// POST /api/functions/send-cra-validation
router.post('/send-validation', requireAuth, requireRole('admin', 'user_cra'), async (req: AuthRequest, res: Response) => {
  const { craId, clientEmail } = req.body;
  if (!craId || !clientEmail) { res.status(400).json({ error: 'craId et clientEmail requis' }); return; }

  const cra = await queryOne<any>(
    `SELECT r.*, c.name AS client_name, p.full_name AS user_name, p.email AS user_email
     FROM public.cra_reports r
     LEFT JOIN public.clients c ON c.id = r.client_id
     LEFT JOIN public.profiles p ON p.id = r.user_id
     WHERE r.id = $1`,
    [craId]
  );
  if (!cra) { res.status(404).json({ error: 'CRA introuvable' }); return; }

  const isAdmin = req.user!.roles.includes('admin');
  if (cra.user_id !== req.user!.id && !isAdmin) { res.status(403).json({ error: 'Accès refusé' }); return; }

  const token = `${uuidv4()}-${uuidv4()}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30j

  await query(
    `UPDATE public.cra_reports SET client_email=$1, validation_token=$2, token_expires_at=$3,
            client_validation_status='sent', updated_at=NOW() WHERE id=$4`,
    [clientEmail, token, expiresAt.toISOString(), craId]
  );

  const monthDate = new Date(cra.month + '-01');
  const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const userName = cra.user_name ?? cra.user_email ?? 'Consultant';
  const approveUrl = `${FRONTEND_URL}/cra/validate?token=${token}&action=approve`;
  const rejectUrl = `${FRONTEND_URL}/cra/validate?token=${token}&action=reject`;

  await sendEmail({
    to: clientEmail,
    subject: `Validation du Compte-Rendu d'Activité - ${monthLabel}`,
    html: `
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Validation du CRA</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Bonjour,</p>
          <p>Vous êtes invité(e) à valider le Compte-Rendu d'Activité suivant :</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p><strong>Consultant :</strong> ${userName}</p>
            <p><strong>Période :</strong> ${monthLabel}</p>
            <p><strong>Client :</strong> ${cra.client_name ?? 'Non spécifié'}</p>
            <p><strong>Jours travaillés :</strong> ${cra.worked_days}</p>
            <p><strong>Jours d'absence :</strong> ${cra.absent_days}</p>
            ${cra.monthly_comment ? `<p><strong>Commentaire :</strong> ${cra.monthly_comment}</p>` : ''}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${approveUrl}" style="display:inline-block;background:#22c55e;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;margin:5px;">✅ Approuver</a>
            <a href="${rejectUrl}" style="display:inline-block;background:#ef4444;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;margin:5px;">❌ Rejeter</a>
          </div>
          <p style="color:#666;font-size:14px;">Ce lien expire dans 30 jours.</p>
        </div>
      </body>
    `,
  });

  res.json({ success: true, message: 'Email de validation envoyé' });
});

// ── Validate CRA by token ─────────────────────────────────────────

// POST /api/functions/validate-cra
router.post('/validate', async (req, res: Response) => {
  const { token, action } = req.body;
  if (!token || !action) { res.status(400).json({ success: false, error: 'token et action requis' }); return; }
  if (action !== 'approve' && action !== 'reject') { res.status(400).json({ success: false, error: 'action invalide' }); return; }

  const cra = await queryOne<any>(
    `SELECT r.*, c.name AS client_name, p.full_name AS user_name, p.email AS user_email
     FROM public.cra_reports r
     LEFT JOIN public.clients c ON c.id = r.client_id
     LEFT JOIN public.profiles p ON p.id = r.user_id
     WHERE r.validation_token = $1`,
    [token]
  );

  if (!cra) {
    res.status(400).json({ success: false, error: 'Token invalide ou expiré', message: "Ce lien de validation n'est plus valide." });
    return;
  }

  if (new Date(cra.token_expires_at) < new Date()) {
    res.status(400).json({ success: false, error: 'Token expiré', message: 'Ce lien de validation a expiré.' });
    return;
  }

  if (cra.client_validation_status === 'approved' || cra.client_validation_status === 'rejected') {
    res.status(400).json({ success: false, error: 'Déjà traité',
      message: `Ce CRA a déjà été ${cra.client_validation_status === 'approved' ? 'approuvé' : 'rejeté'}.`,
      status: cra.client_validation_status });
    return;
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  await query(
    `UPDATE public.cra_reports SET client_validation_status=$1, validated_at=NOW(),
            validation_token=NULL, updated_at=NOW() WHERE id=$2`,
    [newStatus, cra.id]
  );

  const monthDate = new Date(cra.month + '-01');
  const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const userName = cra.user_name ?? cra.user_email ?? 'Consultant';
  const validatedAt = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (action === 'approve') {
    try {
      const dayDetails = await query<any>(
        'SELECT date, state, comment FROM public.cra_day_details WHERE cra_report_id = $1 ORDER BY date',
        [cra.id]
      );

      const pdfBase64 = generateCraPdf({
        month: monthLabel,
        clientName: cra.client_name ?? 'Non spécifié',
        companyName: cra.company_name ?? 'Wavy Services',
        userName,
        workedDays: cra.worked_days,
        absentDays: cra.absent_days,
        monthlyComment: cra.monthly_comment,
        dayDetails,
        validatedAt,
      });

      const attachments = [{
        filename: `CRA_${userName.replace(/\s+/g, '_')}_${cra.month}.pdf`,
        content: pdfBase64,
      }];

      const emailSubject = `CRA Approuvé - ${userName} - ${monthLabel}`;
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ CRA Approuvé</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Le Compte-Rendu d'Activité suivant a été <strong style="color:#22c55e;">approuvé</strong> :</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e;">
              <p><strong>Consultant :</strong> ${userName}</p>
              <p><strong>Période :</strong> ${monthLabel}</p>
              <p><strong>Client :</strong> ${cra.client_name ?? 'Non spécifié'}</p>
              <p><strong>Jours travaillés :</strong> ${cra.worked_days}</p>
              <p><strong>Jours d'absence :</strong> ${cra.absent_days}</p>
            </div>
            <p>Vous trouverez en pièce jointe le récapitulatif PDF.</p>
          </div>
        </div>
      `;

      const recipients: string[] = [];
      if (cra.client_email) recipients.push(cra.client_email);
      if (cra.user_email) recipients.push(cra.user_email);

      for (const to of recipients) {
        await sendEmail({ to, subject: emailSubject, html: emailHtml, attachments });
      }
    } catch (pdfErr) {
      console.error('PDF/email error (non-fatal):', pdfErr);
    }
  }

  res.json({
    success: true,
    status: newStatus,
    message: action === 'approve'
      ? `Le CRA de ${monthLabel} a été approuvé avec succès.`
      : `Le CRA de ${monthLabel} a été rejeté.`,
    month: monthLabel,
    clientName: cra.client_name,
  });
});

export default router;
