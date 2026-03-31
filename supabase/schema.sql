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

alter table public.learner_profiles enable row level security;
alter table public.staff_members enable row level security;

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
