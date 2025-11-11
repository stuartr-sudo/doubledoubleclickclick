-- Newsletter subscribers
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

-- CTA conversions (lightweight event store)
create table if not exists public.cta_conversions (
  id uuid primary key default gen_random_uuid(),
  cta text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Allow anon insert if RLS is enabled; adjust as needed
alter table public.newsletter_subscribers enable row level security;
drop policy if exists p_ins_subscribers on public.newsletter_subscribers;
create policy p_ins_subscribers on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

alter table public.cta_conversions enable row level security;
drop policy if exists p_ins_conversions on public.cta_conversions;
create policy p_ins_conversions on public.cta_conversions
  for insert to anon, authenticated with check (true);


