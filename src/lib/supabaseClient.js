// Supabase client bootstrap.
//
// The whole portal is designed to work with OR without a live Supabase
// backend. If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present we
// create a real client; otherwise `supabase` is null and the app falls back
// to the localStorage mock backend (see ./backend.js). This lets you develop,
// demo, and ship the UI offline, then flip to real Supabase by adding two
// env vars and running supabase/schema.sql — no code changes required.

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Emails that should be treated as admins on first sign-in. Accepts a
// comma-separated list via VITE_ADMIN_BOOTSTRAP_EMAILS (preferred) and still
// honours the legacy single VITE_ADMIN_BOOTSTRAP_EMAIL for backwards compat.
export const adminBootstrapEmails = [
  import.meta.env.VITE_ADMIN_BOOTSTRAP_EMAILS,
  import.meta.env.VITE_ADMIN_BOOTSTRAP_EMAIL,
]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isBootstrapAdmin(email) {
  return Boolean(email) && adminBootstrapEmails.includes(email.trim().toLowerCase());
}
