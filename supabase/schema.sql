create extension if not exists pgcrypto;

create table if not exists public.learner_profiles (
  id uuid primary key,
  username text unique not null,
  full_name text not null,
  email text unique not null,
  role text not null default 'student',
  gender text not null default 'boy',
  avatar_mode text not null default 'generated',
  avatar_emoji text not null default '🙂',
  avatar_image text,
  country_code text not null,
  plan text not null default 'free',
  stage text not null default 'primary',
  level text not null,
  mode text not null default 'solo',
  subject text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  focus text not null,
  status text not null default 'Online',
  country_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_materials (
  id text primary key,
  title text not null,
  summary text not null,
  body text not null,
  country_code text not null,
  stage text not null,
  level text not null,
  subject text not null,
  category text not null,
  resource_type text not null default 'text',
  attachment_name text,
  attachment_data text,
  video_url text,
  question_limit integer,
  questions jsonb not null default '[]'::jsonb,
  uploaded_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback_entries (
  id text primary key,
  user_name text not null,
  user_key text not null unique,
  role text not null,
  country_code text not null,
  rating numeric not null,
  choice text not null,
  ratings jsonb not null default '{}'::jsonb,
  comment text not null default '',
  created_at timestamptz not null default now()
);

alter table public.staff_materials add column if not exists resource_type text not null default 'text';
alter table public.staff_materials add column if not exists attachment_name text;
alter table public.staff_materials add column if not exists attachment_data text;
alter table public.staff_materials add column if not exists video_url text;
alter table public.staff_materials add column if not exists question_limit integer;
alter table public.staff_materials add column if not exists questions jsonb not null default '[]'::jsonb;
alter table public.staff_materials add column if not exists updated_at timestamptz not null default now();
alter table public.feedback_entries add column if not exists user_name text not null default 'Learner';
alter table public.feedback_entries add column if not exists user_key text not null default '';
alter table public.feedback_entries add column if not exists role text not null default 'student';
alter table public.feedback_entries add column if not exists country_code text not null default 'KE';
alter table public.feedback_entries add column if not exists rating numeric not null default 0;
alter table public.feedback_entries add column if not exists choice text not null default '';
alter table public.feedback_entries add column if not exists ratings jsonb not null default '{}'::jsonb;
alter table public.feedback_entries add column if not exists comment text not null default '';
alter table public.feedback_entries add column if not exists created_at timestamptz not null default now();
create unique index if not exists feedback_entries_user_key_idx on public.feedback_entries (user_key);

alter table public.learner_profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.staff_materials enable row level security;
alter table public.feedback_entries enable row level security;

drop policy if exists "Public can read learner usernames" on public.learner_profiles;
create policy "Public can read learner usernames"
on public.learner_profiles
for select
using (true);

drop policy if exists "Users can manage own profile" on public.learner_profiles;
create policy "Users can manage own profile"
on public.learner_profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can read staff" on public.staff_members;
create policy "Authenticated users can read staff"
on public.staff_members
for select
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can add staff" on public.staff_members;
create policy "Authenticated users can add staff"
on public.staff_members
for insert
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete staff" on public.staff_members;
create policy "Authenticated users can delete staff"
on public.staff_members
for delete
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read staff materials" on public.staff_materials;
create policy "Authenticated users can read staff materials"
on public.staff_materials
for select
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can add staff materials" on public.staff_materials;
create policy "Authenticated users can add staff materials"
on public.staff_materials
for insert
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete staff materials" on public.staff_materials;
create policy "Authenticated users can delete staff materials"
on public.staff_materials
for delete
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update staff materials" on public.staff_materials;
create policy "Authenticated users can update staff materials"
on public.staff_materials
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read feedback entries" on public.feedback_entries;
create policy "Authenticated users can read feedback entries"
on public.feedback_entries
for select
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can add feedback entries" on public.feedback_entries;
create policy "Authenticated users can add feedback entries"
on public.feedback_entries
for insert
with check (auth.role() = 'authenticated');

insert into public.learner_profiles (
  id,
  username,
  full_name,
  email,
  role,
  gender,
  avatar_mode,
  avatar_emoji,
  country_code,
  plan,
  stage,
  level,
  mode,
  subject,
  created_at
) values (
  gen_random_uuid(),
  'Admin',
  'Review Buddy Admin',
  'admin@reviewbuddy.app',
  'admin',
  'boy',
  'generated',
  '🛡️',
  'US',
  'elite',
  'teen',
  'Year 10',
  'solo',
  'Mathematics',
  now()
)
on conflict (email) do nothing;
