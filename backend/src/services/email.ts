const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = 'Wavy Services <noreply@wavyservices.fr>';

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — email not sent:', opts.subject);
    return;
  }

  const body: any = {
    from: FROM,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
  };
  if (opts.attachments?.length) {
    body.attachments = opts.attachments;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Resend error: ' + JSON.stringify(err));
  }
}
