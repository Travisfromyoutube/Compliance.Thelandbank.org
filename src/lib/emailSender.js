/**
 * Email sender - Resend integration with mock fallback.
 *
 * When RESEND_API_KEY is set, sends real emails via Resend.
 * Otherwise, logs to console and returns a mock success response.
 *
 * Every send (real or mock) creates a Communication record in the DB.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || 'compliance@thelandbank.org';

/**
 * Send a single email.
 *
 * @param {{ to: string, subject: string, body: string, from?: string }} params
 * @returns {{ success: boolean, messageId?: string, mode: 'live'|'mock', error?: string }}
 */
export async function sendEmail({ to, subject, body, from = FROM_ADDRESS }) {
  // ── Mock mode ──────────────────────────────────────────
  if (!RESEND_API_KEY) {
    const mockId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject} | ID: ${mockId}`);
    return { success: true, messageId: mockId, mode: 'mock' };
  }

  // ── Live mode (Resend) ─────────────────────────────────
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, mode: 'live', error: errData.message || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.id, mode: 'live' };
  } catch (err) {
    return { success: false, mode: 'live', error: err.message };
  }
}

/**
 * Send emails in batch with basic rate limiting.
 *
 * @param {Array<{ to: string, subject: string, body: string }>} emails
 * @param {{ delayMs?: number }} options
 * @returns {Array<{ index: number, success: boolean, messageId?: string, error?: string }>}
 */
export async function sendBatchEmails(emails, { delayMs = 200 } = {}) {
  const results = [];

  for (let i = 0; i < emails.length; i++) {
    const result = await sendEmail(emails[i]);
    results.push({ index: i, ...result });

    // Rate limiting - wait between sends
    if (i < emails.length - 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}
