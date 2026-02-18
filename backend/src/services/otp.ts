import { query, queryOne } from '../db.js';
import { sendEmail } from './email.js';

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(userId: string, email: string): Promise<void> {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Delete old unused OTPs
  await query('DELETE FROM public.otp_codes WHERE user_id = $1 AND used = false', [userId]);

  await query(
    'INSERT INTO public.otp_codes (user_id, code, used, expires_at) VALUES ($1, $2, false, $3)',
    [userId, code, expiresAt.toISOString()]
  );

  await sendEmail({
    to: email,
    subject: 'Votre code de vérification Wavy Services',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2>Code de vérification</h2>
        <p>Votre code de connexion à Wavy Services :</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center;
                    background: #f5f5f5; padding: 24px; border-radius: 8px; margin: 24px 0;">
          ${code}
        </div>
        <p style="color: #666;">Ce code est valable 10 minutes.</p>
        <p style="color: #999; font-size: 12px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
      </div>
    `,
  });
}

export async function checkOtp(
  userId: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const otp = await queryOne<{ id: string }>(
    `SELECT id FROM public.otp_codes
     WHERE user_id = $1 AND code = $2 AND used = false AND expires_at > NOW()`,
    [userId, code]
  );

  if (!otp) return { valid: false, error: 'Code invalide ou expiré' };

  // Mark as used + set long expiry (session remember)
  await query(
    `UPDATE public.otp_codes SET used = true, expires_at = NOW() + INTERVAL '6 months' WHERE id = $1`,
    [otp.id]
  );

  // Clean expired codes
  await query(
    `DELETE FROM public.otp_codes WHERE user_id = $1 AND expires_at < NOW() AND id != $2`,
    [userId, otp.id]
  );

  return { valid: true };
}

export async function isAlreadyVerified(userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM public.otp_codes
     WHERE user_id = $1 AND used = true AND expires_at > NOW()
     LIMIT 1`,
    [userId]
  );
  return !!row;
}
