-- ===========================================================================
-- CERTIFICATE DOWNLOAD TOKENS  (time-limited, emailed download links)
-- ===========================================================================
-- Run this once in the Supabase SQL editor (it is also included at the bottom
-- of schema.sql for fresh installs). Safe to re-run.
--
-- When an admin approves a certificate, the Vercel serverless function
-- /api/approve-certificate inserts a row here with a random `token` and an
-- `expires_at` 24 hours in the future, then emails the user a link:
--     https://<app>/certificate-download/<token>
-- The link is validated server-side by /api/redeem-cert-token.
--
-- Only the serverless functions (which use the service_role key) touch this
-- table, so RLS is enabled with NO policies — anon/authenticated clients are
-- fully denied direct access.
-- ===========================================================================

create table if not exists public.cert_tokens (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique,
  user_id       uuid not null references auth.users(id) on delete cascade,
  resource_name text not null,
  cert_id       text not null,
  expires_at    timestamptz not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_cert_tokens_token on public.cert_tokens(token);
create index if not exists idx_cert_tokens_expires on public.cert_tokens(expires_at);

alter table public.cert_tokens enable row level security;
-- Intentionally no policies: only the service_role (serverless functions) may
-- read or write. The service_role bypasses RLS.
