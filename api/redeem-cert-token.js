// POST /api/redeem-cert-token
// -----------------------------------------------------------------------------
// Public. Validates a certificate download token server-side and, if it is valid
// and not expired, returns the data the browser needs to render/download the
// certificate PDF. The token itself is the only credential — no login required.
//
// Body: { token: string }
// Responses:
//   200 { ok: true, cert, studentName, expiresAt }
//   404 { error: 'invalid',  reason }   — unknown token
//   410 { error: 'expired',  reason }   — past its 24h window
//
// Required env: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js';

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function readJson(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
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
    const { token } = await readJson(req);
    if (!token) return res.status(400).json({ error: 'token is required' });

    const { data: row } = await admin
      .from('cert_tokens').select('*').eq('token', token).maybeSingle();
    if (!row) {
      return res.status(404).json({ error: 'invalid', reason: 'This download link is not valid.' });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(410).json({
        error: 'expired',
        reason: 'This download link has expired. Please ask an administrator to re-issue your certificate.',
      });
    }

    // Record first use (does not invalidate the link within its window).
    if (!row.used_at) {
      await admin.from('cert_tokens').update({ used_at: new Date().toISOString() }).eq('id', row.id);
    }

    // Confirm the certificate is still approved and gather display data.
    const { data: attempt } = await admin
      .from('quiz_attempts')
      .select('percentage, created_at, cert_status')
      .eq('user_id', row.user_id)
      .eq('resource_name', row.resource_name)
      .order('percentage', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attempt && attempt.cert_status !== 'approved') {
      return res.status(410).json({
        error: 'revoked',
        reason: 'This certificate is no longer approved. Please contact an administrator.',
      });
    }

    const { data: studentProfile } = await admin
      .from('profiles').select('email, full_name').eq('user_id', row.user_id).maybeSingle();

    return res.status(200).json({
      ok: true,
      cert: {
        resourceName: row.resource_name,
        id: row.cert_id,
        cert_id: row.cert_id,
        percentage: attempt ? Math.round(Number(attempt.percentage)) : null,
        date: attempt?.created_at || row.created_at,
      },
      studentName: studentProfile?.full_name || studentProfile?.email || 'Student',
      expiresAt: row.expires_at,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unexpected server error' });
  }
}
