-- CaféCost — Supabase schema
--
-- Run this in the Supabase SQL editor. It creates one row per user project and
-- locks it down with row-level security so each account only sees its own data.

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_user_id_unique unique (user_id)
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

drop policy if exists "Users can read their own project" on public.projects;
create policy "Users can read their own project"
  on public.projects
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own project" on public.projects;
create policy "Users can insert their own project"
  on public.projects
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own project" on public.projects;
create policy "Users can update their own project"
  on public.projects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own project" on public.projects;
create policy "Users can delete their own project"
  on public.projects
  for delete
  using (auth.uid() = user_id);

-- Keep updated_at accurate even if a client forgets to send it.
create or replace function public.touch_projects_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row
  execute function public.touch_projects_updated_at();
