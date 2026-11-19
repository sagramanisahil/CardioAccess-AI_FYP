alter table public.user_profiles
  add column if not exists approval_status text not null default 'approved';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_approval_status_check'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_approval_status_check
      check (approval_status in ('pending', 'approved', 'rejected'));
  end if;
end;
$$;

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (
    id,
    full_name,
    facility,
    role,
    approval_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'facility', ''),
    'clinician',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_user_profile() from public, anon, authenticated;
