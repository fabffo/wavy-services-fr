import { Router, Request, Response } from 'express';
import { queryOne } from '../db.js';
import { sendOtp, checkOtp, isAlreadyVerified } from '../services/otp.js';

const router = Router();

// POST /api/functions/send-otp
router.post('/send', async (req: Request, res: Response) => {
  const { userId, email } = req.body;
  if (!userId || !email) { res.status(400).json({ error: 'userId et email requis' }); return; }

  const user = await queryOne('SELECT id FROM auth.users WHERE id = $1', [userId]);
  if (!user) { res.status(404).json({ error: 'Utilisateur introuvable' }); return; }

  await sendOtp(userId, email);
  res.json({ success: true });
});

// POST /api/functions/verify-otp
router.post('/verify', async (req: Request, res: Response) => {
  const { userId, code, checkOnly } = req.body;
  if (!userId) { res.status(400).json({ error: 'userId requis', valid: false }); return; }

  if (checkOnly) {
    const already = await isAlreadyVerified(userId);
    res.json({ alreadyVerified: already });
    return;
  }

  if (!code) { res.status(400).json({ error: 'code requis', valid: false }); return; }

  const result = await checkOtp(userId, code);
  if (!result.valid) {
    res.status(400).json({ valid: false, error: result.error });
    return;
  }
  res.json({ valid: true, message: 'Code vérifié avec succès' });
});

export default router;
