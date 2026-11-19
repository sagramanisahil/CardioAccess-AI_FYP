create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  case_code text not null unique,
  owner_id uuid not null references public.user_profiles (id) on delete cascade,
  status text not null default 'awaiting_inference'
    check (status in ('draft', 'queued', 'awaiting_inference', 'processing', 'completed', 'partially_completed', 'failed')),
  patient_code text not null,
  patient_alias text,
  age smallint check (age between 1 and 120),
  sex text not null check (sex in ('Female', 'Male', 'Other')),
  clinical_notes text not null check (char_length(clinical_notes) between 8 and 500),
  screening_date date not null,
  modality text not null check (modality in ('ecg', 'echo', 'both')),
  has_ecg boolean not null default false,
  has_echo boolean not null default false,
  pair_eligible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cases_modality_files_check check (
    (modality = 'ecg' and has_ecg and not has_echo)
    or (modality = 'echo' and has_echo and not has_ecg)
    or (modality = 'both' and has_ecg and has_echo)
  )
);

create index if not exists cases_owner_created_idx
  on public.cases (owner_id, created_at desc);

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  owner_id uuid not null references public.user_profiles (id) on delete cascade,
  modality text not null check (modality in ('ecg', 'echo')),
  bucket text not null default 'case-inputs' check (bucket = 'case-inputs'),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  sha256 char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  uploaded_by uuid not null references public.user_profiles (id),
  uploaded_at timestamptz not null default now(),
  unique (case_id, modality)
);

create index if not exists uploaded_files_case_idx
  on public.uploaded_files (case_id);

alter table public.cases enable row level security;
alter table public.uploaded_files enable row level security;

revoke all on public.cases from anon, authenticated;
grant select, insert, delete on public.cases to authenticated;

drop policy if exists "Owners can read their cases" on public.cases;
create policy "Owners can read their cases"
  on public.cases for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Users can create cases for themselves" on public.cases;
create policy "Users can create cases for themselves"
  on public.cases for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete their cases" on public.cases;
create policy "Owners can delete their cases"
  on public.cases for delete to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.uploaded_files from anon, authenticated;
grant select, insert on public.uploaded_files to authenticated;

drop policy if exists "Owners can read their file metadata" on public.uploaded_files;
create policy "Owners can read their file metadata"
  on public.uploaded_files for select to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.cases c
      where c.id = uploaded_files.case_id and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can register files for their cases" on public.uploaded_files;
create policy "Owners can register files for their cases"
  on public.uploaded_files for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and uploaded_by = (select auth.uid())
    and exists (
      select 1 from public.cases c
      where c.id = uploaded_files.case_id and c.owner_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit)
values ('case-inputs', 'case-inputs', false, 104857600)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

drop policy if exists "Owners can upload case input files" on storage.objects;
create policy "Owners can upload case input files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'case-inputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.cases c
      where c.id::text = (storage.foldername(name))[2]
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can read case input files" on storage.objects;
create policy "Owners can read case input files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'case-inputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.cases c
      where c.id::text = (storage.foldername(name))[2]
        and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Owners can remove case input files" on storage.objects;
create policy "Owners can remove case input files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'case-inputs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.cases c
      where c.id::text = (storage.foldername(name))[2]
        and c.owner_id = (select auth.uid())
    )
  );

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cases'
    ) then
      alter publication supabase_realtime add table public.cases;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'uploaded_files'
    ) then
      alter publication supabase_realtime add table public.uploaded_files;
    end if;
  end if;
end;
$$;
