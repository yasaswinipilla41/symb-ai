// POST /api/issue-certificate
// -----------------------------------------------------------------------------
// Student self-serve. When a user passes a single-course quiz (>= 70%) their
// certificate is issued automatically — no admin approval. This endpoint marks
// the attempt approved, mints a 24h download token, generates the certificate
// PDF, and emails it to the student as an attachment (with the link as a
// secondary fallback).
//
// Auth: caller sends their Supabase access token as `Authorization: Bearer
// <token>`. The caller may only issue certificates for THEIR OWN attempts.
//
// Env: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
//      RESEND_API_KEY (optional), EMAIL_FROM, PUBLIC_BASE_URL (optional).

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { buildCertificatePdfBuffer } from './_certificate-pdf.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const PASS_PERCENT = 70;

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function baseUrl(req) {
  const explicit = (process.env.PUBLIC_BASE_URL || process.env.VITE_PUBLIC_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return host ? `https://${host}` : '';
}

async function readJson(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

function emailHtml({ studentName, resourceName, link }) {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;padding:32px 0;font-family:Segoe UI,Arial,sans-serif;color:#111827">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="background:#4f46e5;height:8px"></td></tr>
      <tr><td style="padding:32px 40px">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;color:#6b7280;text-transform:uppercase">Symbiosys Technologies</p>
        <h1 style="margin:0 0 16px;font-size:22px;color:#4f46e5">Congratulations — you earned a certificate 🎉</h1>
        <p style="margin:0 0 12px;font-size:15px">Hi ${studentName},</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5">You passed the assessment for <strong>${resourceName}</strong>. Your certificate is attached to this email as a PDF.</p>
        <p style="margin:24px 0;text-align:center">
          <a href="${link}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600">Or download it here</a>
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">You can also download it any time from your dashboard under Certificates.</p>
      </td></tr>
      <tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">Certified by Symbiosys Technologies</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let admin;
  try { admin = adminClient(); } catch (e) { return res.status(500).json({ error: e.message }); }

  try {
    const { attemptId } = await readJson(req);
    if (!attemptId) return res.status(400).json({ error: 'attemptId is required' });

    // --- Authenticate the caller ------------------------------------------
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!bearer) return res.status(401).json({ error: 'Not authenticated' });
    const { data: userData, error: userErr } = await admin.auth.getUser(bearer);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid or expired session' });
    const caller = userData.user;

    // --- Load the attempt + authorize ownership ---------------------------
    const { data: attempt, error: aErr } = await admin
      .from('quiz_attempts').select('*').eq('id', attemptId).maybeSingle();
    if (aErr || !attempt) return res.status(404).json({ error: 'Quiz attempt not found' });
    if (attempt.user_id !== caller.id) return res.status(403).json({ error: 'You can only issue your own certificate.' });
    if (attempt.resource_name.startsWith('module-cert:')) {
      return res.status(400).json({ error: 'Module certificates require admin approval.' });
    }
    if (Number(attempt.percentage) < PASS_PERCENT) {
      return res.status(400).json({ error: 'This attempt has not passed the quiz.' });
    }

    // --- Resolve cert id + approve ----------------------------------------
    let certId = attempt.cert_id;
    if (!certId) {
      const { data: rpcId } = await admin.rpc('certificate_id', {
        p_user_id: attempt.user_id, p_resource_name: attempt.resource_name,
      });
      certId = rpcId;
    }
    await admin.from('quiz_attempts')
      .update({ cert_status: 'approved', ...(certId ? { cert_id: certId } : {}) })
      .eq('id', attemptId);

    // --- Mint a 24h download token ----------------------------------------
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + DAY_MS);
    await admin.from('cert_tokens').insert({
      token,
      user_id: attempt.user_id,
      resource_name: attempt.resource_name,
      cert_id: certId || '',
      expires_at: expiresAt.toISOString(),
    });
    const base = baseUrl(req);
    const link = `${base}/certificate-download/${token}`;

    // --- Student details --------------------------------------------------
    const { data: studentProfile } = await admin
      .from('profiles').select('email, full_name').eq('user_id', attempt.user_id).maybeSingle();
    const studentName = studentProfile?.full_name || studentProfile?.email || 'Student';
    const to = studentProfile?.email;

    // --- Build the PDF ----------------------------------------------------
    const pdf = await buildCertificatePdfBuffer(
      {
        id: certId || '',
        resourceName: attempt.resource_name,
        categoryLabel: attempt.category_label || 'General',
        percentage: Math.round(Number(attempt.percentage)),
        date: attempt.created_at,
      },
      studentName,
      `${base}/verify/${certId || ''}`
    );

    // --- Email the PDF (best-effort) --------------------------------------
    let emailed = false;
    let emailError = null;
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (resendKey && from && to) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
          from, to,
          subject: `Your ${attempt.resource_name} certificate`,
          html: emailHtml({ studentName, resourceName: attempt.resource_name, link }),
          attachments: [{ filename: `${certId || 'certificate'}.pdf`, content: pdf.toString('base64') }],
        });
        if (error) emailError = error.message || String(error);
        else emailed = true;
      } catch (e) {
        emailError = e.message || String(e);
      }
    } else if (!resendKey || !from) {
      emailError = 'Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).';
    } else if (!to) {
      emailError = 'No email address on file.';
    }

    return res.status(200).json({ ok: true, emailed, emailError, link, to, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected server error' });
  }
}
