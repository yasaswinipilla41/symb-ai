// Certificate approval + time-limited download link.
//
// Bridges the frontend to the Vercel serverless functions (/api/*) that do the
// privileged work (approve, mint a 24h token, email the link, validate it).
// When Supabase is NOT configured (offline/demo mock mode) there is no server,
// so we fall back to a fully local flow: approve in the mock store, mint a local
// token, and return the link for on-screen sharing instead of emailing it.

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { quizAttempts } from './backend';
import { mockStore } from './mockStore';
import { certificateId } from './certificates';

const DAY_MS = 24 * 60 * 60 * 1000;
const MOCK_TOKEN_PREFIX = 'mock-';

// Approve a passed attempt's certificate and issue a 24h download link.
// Returns: { ok, emailed, emailError, link, to, expiresAt, mock? }
export async function approveCertificate(attempt) {
  const certId = attempt.cert_id || certificateId(attempt.user_id, attempt.resource_name);

  if (isSupabaseConfigured) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/approve-certificate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ attemptId: attempt.id }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Approval failed (${res.status}).`);
    return body;
  }

  // --- Mock mode: approve locally + mint a local token (no real email) ------
  await quizAttempts.update(attempt.id, { cert_status: 'approved', cert_id: certId });
  const token = `${MOCK_TOKEN_PREFIX}${mockStore.genId()}`;
  mockStore.insert('cert_tokens', {
    token,
    user_id: attempt.user_id,
    resource_name: attempt.resource_name,
    cert_id: certId,
    expires_at: new Date(Date.now() + DAY_MS).toISOString(),
  });
  const link = `${window.location.origin}/certificate-download/${token}`;
  return { ok: true, emailed: false, mock: true, link, expiresAt: new Date(Date.now() + DAY_MS).toISOString() };
}

// Validate a download token and return the certificate payload.
// Returns: { ok, cert, studentName, expiresAt } | { ok:false, error, reason }
export async function redeemCertToken(token) {
  const isMockToken = token.startsWith(MOCK_TOKEN_PREFIX);

  if (isSupabaseConfigured && !isMockToken) {
    const res = await fetch('/api/redeem-cert-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: body.error || 'invalid', reason: body.reason || 'This link is not valid.' };
    }
    return body;
  }

  // --- Mock redeem ----------------------------------------------------------
  const row = mockStore.find('cert_tokens', (r) => r.token === token);
  if (!row) return { ok: false, error: 'invalid', reason: 'This download link is not valid.' };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'expired', reason: 'This download link has expired. Please ask an administrator to re-issue your certificate.' };
  }
  const profile = mockStore.find('profiles', (p) => p.user_id === row.user_id);
  const attempt = mockStore
    .select('quiz_attempts', (a) => a.user_id === row.user_id && a.resource_name === row.resource_name)
    .sort((a, b) => Number(b.percentage) - Number(a.percentage))[0];
  return {
    ok: true,
    cert: {
      resourceName: row.resource_name,
      id: row.cert_id,
      cert_id: row.cert_id,
      percentage: attempt ? Math.round(Number(attempt.percentage)) : null,
      date: attempt?.created_at || row.created_at,
    },
    studentName: profile?.full_name || profile?.email || 'Student',
    expiresAt: row.expires_at,
  };
}
