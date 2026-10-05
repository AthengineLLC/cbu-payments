-- Run in the Supabase SQL editor after 2026-09-add-season.sql.
--
-- Credits are issued when a prepaid event is cancelled or an affiliate is owed
-- money back. They are deliberately NOT netted against the balance due: a
-- credit is tracked next to the balance so it stays visible until it is
-- actually settled, rather than quietly shrinking what an affiliate owes.
--
-- amount is what CBU paid Perfect Game for the event (the invoice balance
-- after team discounts and PG Rewards), not what the affiliate was billed.
-- team and event_name tie the credit back to the event that earned it;
-- both are nullable so a general credit can be issued without one.

create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  affiliate text not null,
  team text,
  event_name text,
  amount numeric not null,
  note text,
  season text not null default 'fall2026',
  created_at timestamptz not null default now()
);

alter table public.credits enable row level security;

drop policy if exists "public access" on public.credits;
create policy "public access" on public.credits for all using (true) with check (true);

create index if not exists credits_season_idx on public.credits (season);
create index if not exists credits_affiliate_idx on public.credits (affiliate);
