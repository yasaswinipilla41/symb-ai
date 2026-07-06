-- ===========================================================================
-- Symbiosys Learning & Assessment Portal — Supabase schema
-- ===========================================================================
-- Run this in the Supabase SQL editor (or `supabase db push`) AFTER creating
-- your project. The app auto-detects Supabase via VITE_SUPABASE_URL /
-- VITE_SUPABASE_ANON_KEY and switches from the localStorage mock to these
-- tables with no code changes.
--
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- ===========================================================================

-- Enable useful extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES  (extends auth.users with role + app data)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  employee_id  text,
  department   text default '',
  avatar_url   text default '',
  role         text not null default 'user' check (role in ('user','admin')),
  status       text not null default 'active' check (status in ('active','inactive','banned')),
  theme        text default 'system',
  language     text default 'en',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CATEGORIES  (admin-managed; seed mirrors src/data/database.js keys)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  icon       text default '',
  sort_order int default 0,
  hidden     boolean default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RESOURCES  (admin overrides / additions on top of the static catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.resources (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category_slug text,
  description  text,
  url          text,
  logo_url     text,
  badges       jsonb default '[]'::jsonb,
  tags         jsonb default '[]'::jsonb,
  popup_details jsonb,
  featured     boolean default false,
  published    boolean default true,
  hidden       boolean default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- LEARNING MATERIALS  (editable PDF / PPT per resource)
-- ---------------------------------------------------------------------------
create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  resource_name text not null,
  kind          text not null check (kind in ('pdf','ppt')),
  title         text,
  storage_path  text,          -- path in Supabase Storage
  content       jsonb,         -- editable slide/section content
  version       int default 1,
  updated_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- QUIZ QUESTIONS  (20 per resource: 10 MCQ, 5 open-ended, 5 true/false)
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  resource_name text not null,
  type          text not null check (type in ('mcq','open','truefalse')),
  prompt        text not null,
  options       jsonb default '[]'::jsonb,  -- for mcq
  correct       jsonb,                       -- correct index / boolean
  marks         int default 1,
  sort_order    int default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- QUIZ ATTEMPTS + ANSWERS
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  resource_name text not null,
  score         numeric default 0,
  max_score     numeric default 0,
  percentage    numeric default 0,
  correct_count int default 0,
  wrong_count   int default 0,
  time_taken_s  int default 0,
  status        text default 'completed',
  answers       jsonb default '[]'::jsonb,   -- includes open-ended text for admin review
  cert_status   text default 'none',         -- 'none', 'pending', 'approved', 'rejected'
  cert_id       text,                        -- populated if percentage >= PASS_PERCENT
  created_at    timestamptz not null default now()
);

-- Add cert_id if the table already existed before this schema update
alter table public.quiz_attempts add column if not exists cert_id text;
create index if not exists idx_quiz_attempts_cert_id on public.quiz_attempts(cert_id);

create or replace function public.base36_encode(n bigint)
returns text
language plpgsql
immutable
as $$
declare
  chars text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  value bigint := n;
  result text := '';
  remainder int;
begin
  if value = 0 then
    return '0';
  end if;

  while value > 0 loop
    remainder := (value % 36)::int;
    result := substr(chars, remainder + 1, 1) || result;
    value := value / 36;
  end loop;

  return result;
end;
$$;

create or replace function public.fnv1a32(input text)
returns bigint
language plpgsql
immutable
as $$
declare
  h bigint := 2166136261;
  i int;
  bytes bytea := convert_to(input, 'UTF8');
begin
  for i in 0..length(bytes) - 1 loop
    h := h # get_byte(bytes, i);
    h := (h * 16777619) % 4294967296;
  end loop;

  return h;
end;
$$;

create or replace function public.certificate_id(p_user_id uuid, p_resource_name text)
returns text
language sql
immutable
as $$
  select 'SYM-' ||
    substr(lpad(public.base36_encode(public.fnv1a32(p_user_id::text || '::' || p_resource_name)), 6, '0'), 1, 4) ||
    '-' ||
    substr(lpad(public.base36_encode(public.fnv1a32(p_resource_name || '::' || p_user_id::text)), 6, '0'), 1, 4);
$$;

create or replace function public.set_quiz_attempt_cert_id()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.percentage, 0) >= 80 and new.cert_id is null then
    new.cert_id := public.certificate_id(new.user_id, new.resource_name);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_quiz_attempt_cert_id on public.quiz_attempts;
create trigger trg_quiz_attempt_cert_id
  before insert or update of percentage, resource_name, user_id, cert_id on public.quiz_attempts
  for each row execute function public.set_quiz_attempt_cert_id();

update public.quiz_attempts
   set cert_id = public.certificate_id(user_id, resource_name)
 where cert_id is null and percentage >= 80;

-- ---------------------------------------------------------------------------
-- BOOKMARKS
-- ---------------------------------------------------------------------------
create table if not exists public.bookmarks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  resource_name text not null,
  resource_url  text,
  created_at    timestamptz not null default now(),
  unique (user_id, resource_name)
);

-- ---------------------------------------------------------------------------
-- HISTORY  (resources/pdfs/ppts opened, logins, searches, downloads…)
-- ---------------------------------------------------------------------------
create table if not exists public.history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,   -- 'login'|'logout'|'view'|'pdf'|'ppt'|'quiz'|'download'|'search'
  title      text,
  meta       jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- DOWNLOADS
-- ---------------------------------------------------------------------------
create table if not exists public.downloads (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  resource_name text,
  kind          text,   -- 'pdf'|'ppt'
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS  (user_id NULL = broadcast to all)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  read       boolean default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FEEDBACK  (ratings, tool suggestions, issue reports)
-- ---------------------------------------------------------------------------
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  kind       text,   -- 'rating'|'suggestion'|'issue'
  rating     int,
  message    text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ACTIVITY LOGS  (audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  action     text not null,
  detail     text,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================
alter table public.profiles       enable row level security;
alter table public.bookmarks      enable row level security;
alter table public.history        enable row level security;
alter table public.quiz_attempts  enable row level security;
alter table public.downloads      enable row level security;
alter table public.notifications  enable row level security;
alter table public.feedback       enable row level security;
alter table public.activity_logs  enable row level security;
alter table public.materials      enable row level security;
alter table public.resources      enable row level security;
alter table public.categories     enable row level security;
alter table public.quiz_questions enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

-- PROFILES: user sees/edits own; admin sees/edits all
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (user_id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (user_id = auth.uid() or public.is_admin());

-- Generic owner-or-admin policies applied to per-user tables
do $$
declare t text;
begin
  foreach t in array array['bookmarks','history','quiz_attempts','downloads','feedback'] loop
    execute format('drop policy if exists %I_owner_select on public.%I;', t, t);
    execute format('create policy %I_owner_select on public.%I for select using (user_id = auth.uid() or public.is_admin());', t, t);
    execute format('drop policy if exists %I_owner_write on public.%I;', t, t);
    execute format('create policy %I_owner_write on public.%I for insert with check (user_id = auth.uid());', t, t);
    execute format('drop policy if exists %I_owner_update on public.%I;', t, t);
    execute format('create policy %I_owner_update on public.%I for update using (user_id = auth.uid() or public.is_admin());', t, t);
    execute format('drop policy if exists %I_owner_delete on public.%I;', t, t);
    execute format('create policy %I_owner_delete on public.%I for delete using (user_id = auth.uid() or public.is_admin());', t, t);
  end loop;
end $$;

-- NOTIFICATIONS: own or broadcast; admin writes
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select
  using (user_id = auth.uid() or user_id is null or public.is_admin());
drop policy if exists notifications_admin_write on public.notifications;
create policy notifications_admin_write on public.notifications for insert
  with check (public.is_admin());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid() or public.is_admin());

-- ACTIVITY LOGS: admin reads all, users insert their own
drop policy if exists activity_select on public.activity_logs;
create policy activity_select on public.activity_logs for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists activity_insert on public.activity_logs;
create policy activity_insert on public.activity_logs for insert
  with check (user_id = auth.uid() or user_id is null);

-- PUBLIC-READ content tables (everyone reads, admin writes)
do $$
declare t text;
begin
  foreach t in array array['resources','categories','quiz_questions','materials'] loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (true);', t, t);
    execute format('drop policy if exists %I_admin_write on public.%I;', t, t);
    execute format('create policy %I_admin_write on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- ===========================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  -- Emails that are automatically granted the admin role on sign-up.
  -- Keep this list in sync with VITE_ADMIN_BOOTSTRAP_EMAILS in .env.
  admin_emails text[] := array[
    'support@symbiosystech.com',
    'yasaswinipilla41@gmail.com',
    'sudheerbabu.d@symbiosystech.com',
    'yerradinesh01@gmail.com'
  ];
  assigned_role text := 'user';
begin
  if lower(new.email) = any (admin_emails) then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (user_id, email, full_name, employee_id, role, status)
  values (
    new.id,
    new.email,
    -- Google sends the display name as 'full_name' or 'name'.
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'employee_id', ''),
    assigned_role,
    'active'
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

-- Backfill: if either admin already signed up before this trigger existed,
-- promote them now. Safe to re-run.
update public.profiles
   set role = 'admin'
 where lower(email) in ('yasaswinipilla41@gmail.com', 'sudheerbabu.d@symbiosystech.com', 'yerradinesh01@gmail.com')
   and role <> 'admin';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- ADMIN: fully delete a user (auth account + ALL their data)
-- ---------------------------------------------------------------------------
-- Deleting the row in auth.users cascades to public.profiles and every
-- per-user table (bookmarks, history, quiz_attempts, downloads, notifications;
-- feedback/activity_logs are set null), so this removes the user completely.
--
-- Runs as SECURITY DEFINER (owner = postgres) so it can touch auth.users, but
-- it is gated: the caller must be an admin and cannot delete themselves. This
-- is why NO service_role key is needed in the frontend.
-- ===========================================================================
create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete users';
  end if;
  if target_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  delete from auth.users where id = target_id;
end $$;

-- Only signed-in users may call it (the body then enforces admin-only).
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ===========================================================================
-- To promote an admin after they sign up, run:
--   update public.profiles set role = 'admin' where email = 'you@company.com';
-- ===========================================================================

-- ===========================================================================
-- PUBLIC CERTIFICATE VERIFICATION
-- ===========================================================================
create or replace function public.get_public_certificate(p_cert_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', coalesce(q.cert_id, public.certificate_id(q.user_id, q.resource_name)),
    'resource_name', q.resource_name,
    'percentage', q.percentage,
    'created_at', q.created_at,
    'student_name', coalesce(p.full_name, p.email),
    'cert_status', q.cert_status
  ) into result
  from public.quiz_attempts q
  join public.profiles p on p.user_id = q.user_id
  where q.percentage >= 80
    and (
      q.cert_id = p_cert_id
      or public.certificate_id(q.user_id, q.resource_name) = p_cert_id
    )
  order by q.percentage desc, q.created_at asc
  limit 1;
  return result;
end;
$$;

grant execute on function public.get_public_certificate(text) to anon, authenticated;

-- ===========================================================================
-- CERTIFICATE DOWNLOAD TOKENS  (time-limited, emailed download links)
-- ===========================================================================
-- When an admin approves a certificate, /api/approve-certificate inserts a row
-- here with a random token and an expires_at 24h in the future, then emails the
-- user a link (https://<app>/certificate-download/<token>). The link is
-- validated server-side by /api/redeem-cert-token. Only the serverless
-- functions (service_role) touch this table, so RLS is on with NO policies.
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
-- Intentionally no policies: only the service_role (serverless functions) may access.
