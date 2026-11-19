create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'clinician' check (role in ('clinician', 'nurse', 'admin')),
  facility text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.user_profiles (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_settings enable row level security;

revoke all on public.user_profiles from anon, authenticated;
grant select on public.user_profiles to authenticated;
grant update (full_name, facility) on public.user_profiles to authenticated;

create policy "Users can read their own profile"
  on public.user_profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile fields"
  on public.user_profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.user_settings from anon, authenticated;
grant select, insert, update on public.user_settings to authenticated;

create policy "Users can read their own settings"
  on public.user_settings for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert their own settings"
  on public.user_settings for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own settings"
  on public.user_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, full_name, facility, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'facility', ''),
    'clinician'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_user_profile() from public, anon, authenticated;

drop trigger if exists create_user_profile_after_signup on auth.users;
create trigger create_user_profile_after_signup
  after insert on auth.users
  for each row execute procedure public.create_user_profile();
