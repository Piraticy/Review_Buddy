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
  birth_day integer,
  birth_month integer,
  birth_year integer,
  streak_count integer not null default 0,
  last_active_on text,
  tutorial_seen boolean not null default false,
  qualifications text,
  eligibility text,
  support_focus text,
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
  email text,
  username text,
  password text,
  qualifications text,
  eligibility text,
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
  uploaded_by_email text,
  approval_status text not null default 'approved',
  ai_review_summary text,
  admin_review_note text,
  reviewed_at timestamptz,
  reviewed_by text,
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

create table if not exists public.support_requests (
  id text primary key,
  created_at timestamptz not null default now(),
  created_by text not null,
  created_by_role text not null,
  created_by_email text not null default '',
  country_code text not null,
  title text not null,
  detail text not null,
  category text not null,
  status text not null default 'new',
  assigned_to_name text,
  assigned_to_email text,
  assigned_to_role text,
  completed_at timestamptz,
  completed_by text,
  related_material_id text
);

create table if not exists public.announcements (
  id text primary key,
  title text not null,
  message text not null,
  audience text not null default 'all',
  published_by_email text not null default '',
  created_at timestamptz not null default now()
);

alter table public.learner_profiles add column if not exists birth_day integer;
alter table public.learner_profiles add column if not exists birth_month integer;
alter table public.learner_profiles add column if not exists birth_year integer;
alter table public.learner_profiles add column if not exists streak_count integer not null default 0;
alter table public.learner_profiles add column if not exists last_active_on text;
alter table public.learner_profiles add column if not exists tutorial_seen boolean not null default false;
alter table public.learner_profiles add column if not exists qualifications text;
alter table public.learner_profiles add column if not exists eligibility text;
alter table public.learner_profiles add column if not exists support_focus text;

alter table public.staff_members add column if not exists email text;
alter table public.staff_members add column if not exists username text;
alter table public.staff_members add column if not exists password text;
alter table public.staff_members add column if not exists qualifications text;
alter table public.staff_members add column if not exists eligibility text;

alter table public.staff_materials add column if not exists resource_type text not null default 'text';
alter table public.staff_materials add column if not exists attachment_name text;
alter table public.staff_materials add column if not exists attachment_data text;
alter table public.staff_materials add column if not exists video_url text;
alter table public.staff_materials add column if not exists question_limit integer;
alter table public.staff_materials add column if not exists questions jsonb not null default '[]'::jsonb;
alter table public.staff_materials add column if not exists uploaded_by_email text;
alter table public.staff_materials add column if not exists approval_status text not null default 'approved';
alter table public.staff_materials add column if not exists ai_review_summary text;
alter table public.staff_materials add column if not exists admin_review_note text;
alter table public.staff_materials add column if not exists reviewed_at timestamptz;
alter table public.staff_materials add column if not exists reviewed_by text;
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

alter table public.support_requests add column if not exists created_by_email text not null default '';
alter table public.support_requests add column if not exists assigned_to_name text;
alter table public.support_requests add column if not exists assigned_to_email text;
alter table public.support_requests add column if not exists assigned_to_role text;
alter table public.support_requests add column if not exists completed_at timestamptz;
alter table public.support_requests add column if not exists completed_by text;
alter table public.announcements add column if not exists published_by_email text not null default '';

create unique index if not exists feedback_entries_user_key_idx on public.feedback_entries (user_key);
create index if not exists staff_materials_uploaded_by_email_idx on public.staff_materials (uploaded_by_email);
create index if not exists staff_materials_status_idx on public.staff_materials (approval_status, updated_at desc);
create index if not exists support_requests_created_by_email_idx on public.support_requests (created_by_email);
create index if not exists support_requests_assigned_to_email_idx on public.support_requests (assigned_to_email);
create index if not exists support_requests_status_idx on public.support_requests (status, created_at desc);
create index if not exists announcements_created_at_idx on public.announcements (created_at desc);

alter table public.learner_profiles enable row level security;
alter table public.staff_members enable row level security;
alter table public.staff_materials enable row level security;
alter table public.feedback_entries enable row level security;
alter table public.support_requests enable row level security;
alter table public.announcements enable row level security;

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
drop policy if exists "Authenticated users can delete staff" on public.staff_members;
drop policy if exists "Admins can manage staff" on public.staff_members;
create policy "Admins can manage staff"
on public.staff_members
for all
using (
  exists (
    select 1
    from public.learner_profiles
    where learner_profiles.id = auth.uid()
      and learner_profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.learner_profiles
    where learner_profiles.id = auth.uid()
      and learner_profiles.role = 'admin'
  )
);

drop policy if exists "Authenticated users can read staff materials" on public.staff_materials;
drop policy if exists "Authenticated users can add staff materials" on public.staff_materials;
drop policy if exists "Authenticated users can delete staff materials" on public.staff_materials;
drop policy if exists "Authenticated users can update staff materials" on public.staff_materials;
create policy "Authenticated users can read scoped staff materials"
on public.staff_materials
for select
using (
  auth.role() = 'authenticated'
  and (
    approval_status = 'approved'
    or lower(coalesce(uploaded_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.learner_profiles
      where learner_profiles.id = auth.uid()
        and learner_profiles.role = 'admin'
    )
  )
);

create policy "Owners and admins can add staff materials"
on public.staff_materials
for insert
with check (
  auth.role() = 'authenticated'
  and (
    lower(coalesce(uploaded_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.learner_profiles
      where learner_profiles.id = auth.uid()
        and learner_profiles.role = 'admin'
    )
  )
);

create policy "Owners and admins can update staff materials"
on public.staff_materials
for update
using (
  auth.role() = 'authenticated'
  and (
    lower(coalesce(uploaded_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.learner_profiles
      where learner_profiles.id = auth.uid()
        and learner_profiles.role = 'admin'
    )
  )
)
with check (
  auth.role() = 'authenticated'
  and (
    lower(coalesce(uploaded_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.learner_profiles
      where learner_profiles.id = auth.uid()
        and learner_profiles.role = 'admin'
    )
  )
);

create policy "Owners and admins can delete staff materials"
on public.staff_materials
for delete
using (
  auth.role() = 'authenticated'
  and (
    lower(coalesce(uploaded_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.learner_profiles
      where learner_profiles.id = auth.uid()
        and learner_profiles.role = 'admin'
    )
  )
);

drop policy if exists "Authenticated users can read feedback entries" on public.feedback_entries;
drop policy if exists "Authenticated users can add feedback entries" on public.feedback_entries;
drop policy if exists "Admins can delete feedback entries" on public.feedback_entries;
create policy "Owners and admins can read feedback entries"
on public.feedback_entries
for select
using (
  auth.role() = 'authenticated'
  and (
    lower(coalesce(user_key, '')) = lower(
      coalesce(
        (
          select learner_profiles.role || ':' || lower(coalesce(auth.jwt() ->> 'email', ''))
          from public.learner_profiles
          where learner_profiles.id = auth.uid()
          limit 1
        ),
        'student:' || lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    )
    or exists (
      select 1
      from public.learner_profiles
      where learner_profiles.id = auth.uid()
        and learner_profiles.role = 'admin'
    )
  )
);

create policy "Authenticated users can add feedback entries"
on public.feedback_entries
for insert
with check (auth.role() = 'authenticated');

create policy "Admins can delete feedback entries"
on public.feedback_entries
for delete
using (
  exists (
    select 1
    from public.learner_profiles
    where learner_profiles.id = auth.uid()
      and learner_profiles.role = 'admin'
  )
);

drop policy if exists "Owners and admins can read support requests" on public.support_requests;
drop policy if exists "Authenticated users can create support requests" on public.support_requests;
drop policy if exists "Admins can update support requests" on public.support_requests;
drop policy if exists "Admins and assigned staff can update support requests" on public.support_requests;
drop policy if exists "Admins can delete support requests" on public.support_requests;
create policy "Owners and admins can read support requests"
on public.support_requests
for select
using (
  auth.role() = 'authenticated'
  and (
    lower(coalesce(created_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or lower(coalesce(assigned_to_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.learner_profiles
      where learner_profiles.id = auth.uid()
        and learner_profiles.role = 'admin'
    )
  )
);

create policy "Authenticated users can create support requests"
on public.support_requests
for insert
with check (
  auth.role() = 'authenticated'
  and lower(coalesce(created_by_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "Admins and assigned staff can update support requests"
on public.support_requests
for update
using (
  exists (
    select 1
    from public.learner_profiles
    where learner_profiles.id = auth.uid()
      and learner_profiles.role = 'admin'
  )
  or lower(coalesce(assigned_to_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  exists (
    select 1
    from public.learner_profiles
    where learner_profiles.id = auth.uid()
      and learner_profiles.role = 'admin'
  )
  or lower(coalesce(assigned_to_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "Admins can delete support requests"
on public.support_requests
for delete
using (
  exists (
    select 1
    from public.learner_profiles
    where learner_profiles.id = auth.uid()
      and learner_profiles.role = 'admin'
  )
);

drop policy if exists "Authenticated users can read announcements" on public.announcements;
drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Authenticated users can read announcements"
on public.announcements
for select
using (auth.role() = 'authenticated');

create policy "Admins can manage announcements"
on public.announcements
for all
using (
  exists (
    select 1
    from public.learner_profiles
    where learner_profiles.id = auth.uid()
      and learner_profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.learner_profiles
    where learner_profiles.id = auth.uid()
      and learner_profiles.role = 'admin'
  )
);

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
  tutorial_seen,
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
  true,
  now()
)
on conflict (email) do nothing;
