-- ============================================================
-- Memory Stamp — Schema de Produção
-- Extraído em 2026-08-18 via Management API (pg_policies, pg_constraint, information_schema)
-- Projeto origem: qtwvjxfenvobjbdpghfn (South America - São Paulo)
--
-- Aplicar no projeto de dev via Supabase Dashboard → SQL Editor
-- ANTES de rodar o SQL: criar o bucket "stamp-photos" como Private
-- via Dashboard → Storage → New bucket
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TABLE: public.user_data
-- ─────────────────────────────────────────────────────────────
create table if not exists public.user_data (
  user_id           uuid         primary key references auth.users(id) on delete cascade,
  stamps            jsonb        not null default '[]'::jsonb,
  volumes           jsonb        not null default '[]'::jsonb,
  user_name         text,
  updated_at        timestamptz  not null default now(),
  profile_photo_url text
);

alter table public.user_data enable row level security;

drop policy if exists "Users can manage their own data" on public.user_data;
create policy "Users can manage their own data"
  on public.user_data
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. TABLE: public.user_consents
-- ─────────────────────────────────────────────────────────────
create table if not exists public.user_consents (
  id                  uuid         primary key default gen_random_uuid(),
  user_id             uuid         not null references auth.users(id) on delete cascade,
  terms_version       text         not null,
  privacy_version     text         not null,
  source              text         not null,
  client_recorded_at  timestamptz,
  consented_at        timestamptz  not null default now(),
  created_at          timestamptz  not null default now()
);

create index if not exists user_consents_user_id_idx
  on public.user_consents (user_id, consented_at desc);

alter table public.user_consents enable row level security;

drop policy if exists "user_consents_select_own" on public.user_consents;
create policy "user_consents_select_own"
  on public.user_consents for select
  using (auth.uid() = user_id);

drop policy if exists "user_consents_insert_own" on public.user_consents;
create policy "user_consents_insert_own"
  on public.user_consents for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. FUNCTION: public.delete_own_account()
-- ─────────────────────────────────────────────────────────────
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.user_data where user_id = uid;
  -- user_consents rows cascade automatically via the FK's ON DELETE CASCADE
  -- once auth.users is deleted below
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. STORAGE POLICIES: stamp-photos bucket
-- (bucket criado manualmente como Private antes de rodar este bloco)
-- ─────────────────────────────────────────────────────────────

-- INSERT
drop policy if exists "Users can upload own photos" on storage.objects;
create policy "Users can upload own photos"
  on storage.objects for insert to public
  with check (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

drop policy if exists "Users can upload their own photos" on storage.objects;
create policy "Users can upload their own photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

drop policy if exists "Users can upload their own stamp photos" on storage.objects;
create policy "Users can upload their own stamp photos"
  on storage.objects for insert to public
  with check (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

-- SELECT
drop policy if exists "Public read access" on storage.objects;
create policy "Public read access"
  on storage.objects for select to public
  using (bucket_id = 'stamp-photos');

drop policy if exists "Users can view own photos" on storage.objects;
create policy "Users can view own photos"
  on storage.objects for select to public
  using (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

-- UPDATE
drop policy if exists "Users can update their own photos" on storage.objects;
create policy "Users can update their own photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

drop policy if exists "Users can update their own stamp photos" on storage.objects;
create policy "Users can update their own stamp photos"
  on storage.objects for update to public
  using (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

-- DELETE
drop policy if exists "Users can delete own photos" on storage.objects;
create policy "Users can delete own photos"
  on storage.objects for delete to public
  using (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

drop policy if exists "Users can delete their own photos" on storage.objects;
create policy "Users can delete their own photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);

drop policy if exists "Users can delete their own stamp photos" on storage.objects;
create policy "Users can delete their own stamp photos"
  on storage.objects for delete to public
  using (bucket_id = 'stamp-photos' and (storage.foldername(name))[1] = (auth.uid())::text);
