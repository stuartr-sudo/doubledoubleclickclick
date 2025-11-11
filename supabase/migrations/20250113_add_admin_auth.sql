-- Admin users table for authentication
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

-- Admin sessions table for persistent login
create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  session_token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Create index for faster session lookups
create index if not exists idx_admin_sessions_token on public.admin_sessions(session_token);
create index if not exists idx_admin_sessions_expires on public.admin_sessions(expires_at);

-- Enable RLS
alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;

-- Policies (admin tables are managed server-side only, no direct client access)
drop policy if exists p_admin_users_no_access on public.admin_users;
create policy p_admin_users_no_access on public.admin_users
  for all using (false);

drop policy if exists p_admin_sessions_no_access on public.admin_sessions;
create policy p_admin_sessions_no_access on public.admin_sessions
  for all using (false);

-- Insert default admin user (username: admin, password: admin123)
-- Password hash is bcrypt hash of "admin123"
-- IMPORTANT: Change this password immediately after first login!
insert into public.admin_users (username, password_hash)
values ('admin', '$2a$10$GHIG/8HLGppQ9CVXrSBSqu/Q/ftbF2Zf7FoMxJIE4MZERCibj55HW')
on conflict (username) do nothing;

