-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Creates the tables behind "Add Affiliate" and "Add Line Item" in the admin portal.

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.line_items (
  id uuid primary key default gen_random_uuid(),
  affiliate text not null,
  description text not null,
  team text,
  amount numeric not null,
  discount boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.affiliates enable row level security;
alter table public.line_items enable row level security;

create policy "public access" on public.affiliates for all using (true) with check (true);
create policy "public access" on public.line_items for all using (true) with check (true);
