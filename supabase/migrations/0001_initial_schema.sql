-- 0001_initial_schema
-- MVP schema for Job Tracker: profiles, applications and their AI analyses.
-- Every table is owner-only through RLS: (select auth.uid()) = user_id.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.application_status as enum ('applied', 'interview', 'offer', 'rejected');
exception
  when duplicate_object then null;
end
$$;

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  summary text not null default '',
  skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_summary_length check (char_length(summary) <= 5000),
  constraint profiles_skills_count check (cardinality(skills) <= 100)
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text not null,
  role text not null,
  job_url text,
  job_description text not null default '',
  status public.application_status not null default 'applied',
  notes text,
  applied_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_company_length check (char_length(btrim(company)) between 1 and 200),
  constraint applications_role_length check (char_length(btrim(role)) between 1 and 200),
  constraint applications_job_url_format check (
    job_url is null or (char_length(job_url) <= 2048 and job_url ~* '^https?://')
  ),
  constraint applications_job_description_length check (char_length(job_description) <= 50000),
  constraint applications_notes_length check (notes is null or char_length(notes) <= 10000),
  -- Target of the ownership foreign key on application_analyses.
  constraint applications_id_user_id_key unique (id, user_id)
);

create index if not exists applications_user_id_status_idx
  on public.applications (user_id, status);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- application_analyses (one per application)
-- ---------------------------------------------------------------------------

create table if not exists public.application_analyses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  requirements text[] not null default '{}',
  match_score integer not null,
  matched_skills text[] not null default '{}',
  missing_skills text[] not null default '{}',
  tips text[] not null,
  created_at timestamptz not null default now(),
  constraint application_analyses_match_score_range check (match_score between 0 and 100),
  constraint application_analyses_tips_count check (cardinality(tips) = 3),
  -- An analysis can only point to an application owned by the same user.
  constraint application_analyses_application_owner_fkey
    foreign key (application_id, user_id)
    references public.applications (id, user_id)
    on delete cascade
);

create index if not exists application_analyses_user_id_idx
  on public.application_analyses (user_id);

-- ---------------------------------------------------------------------------
-- Privileges: anonymous visitors get nothing.
-- ---------------------------------------------------------------------------

revoke all on public.profiles from anon;
revoke all on public.applications from anon;
revoke all on public.application_analyses from anon;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.application_analyses enable row level security;

-- profiles

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- applications

drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own" on public.applications
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- application_analyses

drop policy if exists "application_analyses_select_own" on public.application_analyses;
create policy "application_analyses_select_own" on public.application_analyses
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "application_analyses_insert_own" on public.application_analyses;
create policy "application_analyses_insert_own" on public.application_analyses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "application_analyses_update_own" on public.application_analyses;
create policy "application_analyses_update_own" on public.application_analyses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "application_analyses_delete_own" on public.application_analyses;
create policy "application_analyses_delete_own" on public.application_analyses
  for delete to authenticated
  using ((select auth.uid()) = user_id);
