// POST /api/approve-certificate
// -----------------------------------------------------------------------------
// Admin-only. Approves a passed quiz attempt's certificate, mints a random
// 24-hour download token, stores it in public.cert_tokens, and emails the user a
// time-limited download link via Resend.
//
// Auth: the caller must send their Supabase access token as `Authorization:
// Bearer <token>`. We resolve the user from it and check their profile role is
// 'admin' before doing anything with the service-role key.
//
// Required environment variables (set in the Vercel dashboard):
//   SUPABASE_URL                 (or falls back to VITE_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY    (secret — bypasses RLS; NEVER expose to the client)
//   RESEND_API_KEY               (optional — without it approval still works, email is skipped)
//   EMAIL_FROM                   e.g. "Symbiosys Technologies <certificates@symbiosystech.com>"
//   PUBLIC_BASE_URL              (or falls back to VITE_PUBLIC_BASE_URL / the request host)

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

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

function emailHtml({ studentName, resourceName, link, expiresAtLabel }) {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;padding:32px 0;font-family:Segoe UI,Arial,sans-serif;color:#111827">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="background:#4f46e5;height:8px"></td></tr>
      <tr><td style="padding:32px 40px">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;color:#6b7280;text-transform:uppercase">Symbiosys Technologies</p>
        <h1 style="margin:0 0 16px;font-size:22px;color:#4f46e5">Your certificate is approved 🎉</h1>
        <p style="margin:0 0 12px;font-size:15px">Hi ${studentName},</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5">Your certificate for <strong>${resourceName}</strong> has been approved by an administrator. You can now download it as a PDF using the secure link below.</p>
        <p style="margin:24px 0;text-align:center">
          <a href="${link}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600">Download your certificate</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#b45309"><strong>This link expires ${expiresAtLabel}</strong> (24 hours from approval). After that, ask an admin to re-issue it.</p>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;word-break:break-all">If the button doesn't work, copy this URL into your browser:<br>${link}</p>
      </td></tr>
      <tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">Certified by Symbiosys Technologies</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let admin;
  try {
    admin = adminClient();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  try {
    const { attemptId } = await readJson(req);
    if (!attemptId) return res.status(400).json({ error: 'attemptId is required' });

    // --- Authenticate the caller ------------------------------------------
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!bearer) return res.status(401).json({ error: 'Not authenticated' });

    const { data: userData, error: userErr } = await admin.auth.getUser(bearer);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid or expired session' });
    const caller = userData.user;

    // --- Authorize: caller must be an admin -------------------------------
    const { data: callerProfile } = await admin
      .from('profiles').select('role').eq('user_id', caller.id).maybeSingle();
    if (callerProfile?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can approve certificates.' });
    }

    // --- Load the attempt --------------------------------------------------
    const { data: attempt, error: aErr } = await admin
      .from('quiz_attempts').select('*').eq('id', attemptId).maybeSingle();
    if (aErr || !attempt) return res.status(404).json({ error: 'Quiz attempt not found' });
    if (Number(attempt.percentage) < PASS_PERCENT) {
      return res.status(400).json({ error: 'This attempt has not passed the quiz.' });
    }

    // --- Resolve the certificate id (trigger normally sets it) -------------
    let certId = attempt.cert_id;
    if (!certId) {
      const { data: rpcId } = await admin.rpc('certificate_id', {
        p_user_id: attempt.user_id,
        p_resource_name: attempt.resource_name,
      });
      certId = rpcId;
    }

    // --- Approve the attempt ----------------------------------------------
    const { error: upErr } = await admin
      .from('quiz_attempts')
      .update({ cert_status: 'approved', ...(certId ? { cert_id: certId } : {}) })
      .eq('id', attemptId);
    if (upErr) return res.status(500).json({ error: `Could not approve: ${upErr.message}` });

    // --- Mint a 24h download token ----------------------------------------
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + DAY_MS);
    const { error: tokErr } = await admin.from('cert_tokens').insert({
      token,
      user_id: attempt.user_id,
      resource_name: attempt.resource_name,
      cert_id: certId || attempt.cert_id || '',
      expires_at: expiresAt.toISOString(),
    });
    if (tokErr) return res.status(500).json({ error: `Could not create download link: ${tokErr.message}` });

    const link = `${baseUrl(req)}/certificate-download/${token}`;

    // --- Look up the student's email + name -------------------------------
    const { data: studentProfile } = await admin
      .from('profiles').select('email, full_name').eq('user_id', attempt.user_id).maybeSingle();
    const studentName = studentProfile?.full_name || studentProfile?.email || 'Student';
    const to = studentProfile?.email;

    // --- Send the email (best-effort) -------------------------------------
    let emailed = false;
    let emailError = null;
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (resendKey && from && to) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const { error } = await resend.emails.send({
          from,
          to,
          subject: `Your ${attempt.resource_name} certificate is approved`,
          html: emailHtml({
            studentName,
            resourceName: attempt.resource_name,
            link,
            expiresAtLabel: expiresAt.toUTCString(),
          }),
        });
        if (error) emailError = error.message || String(error);
        else emailed = true;
      } catch (e) {
        emailError = e.message || String(e);
      }
    } else if (!resendKey || !from) {
      emailError = 'Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).';
    } else if (!to) {
      emailError = 'The student has no email address on file.';
    }

    // Always return the link so the admin can share it manually if email failed.
    return res.status(200).json({
      ok: true,
      emailed,
      emailError,
      link,
      to,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected server error' });
  }
}
