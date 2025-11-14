-- Lead capture submissions table
create table if not exists public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  website text,
  message text,
  plan_type text, -- e.g. 'agencies', 'enterprise', 'beta'
  source text,    -- e.g. 'agencies-page', 'enterprise-page', 'beta-page'
  created_at timestamptz not null default now()
);

alter table public.lead_captures enable row level security;

-- Allow anonymous inserts from the public site
drop policy if exists p_ins_lead_captures on public.lead_captures;
create policy p_ins_lead_captures
  on public.lead_captures
  for insert
  to anon, authenticated
  with check (true);


