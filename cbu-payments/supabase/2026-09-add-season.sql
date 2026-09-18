-- Run once in the Supabase SQL editor before deploying the season switcher.
--
-- Payments and line items were previously untagged because the tracker only
-- ever showed one season. Every existing row is Summer 2026, so the default
-- backfills them; the app writes an explicit season id on every insert from
-- here on (ids live in SEASONS in src/data.js).

alter table payments   add column if not exists season text not null default 'summer2026';
alter table line_items add column if not exists season text not null default 'summer2026';

create index if not exists payments_season_idx   on payments (season);
create index if not exists line_items_season_idx on line_items (season);
